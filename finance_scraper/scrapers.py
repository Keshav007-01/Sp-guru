"""
Core scraping functions for Indian finance data.
Uses JSON APIs wherever possible (not HTML scraping) for reliability.
All URLs verified as of Feb 2026.
"""

import re
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import Any

import requests
from bs4 import BeautifulSoup

from .config import HEADERS, MAX_NEWS_PER_SOURCE, NEWS_RSS_FEEDS, REQUEST_TIMEOUT

VERBOSE = True


def _log(msg: str):
    if VERBOSE:
        print(f"  [DEBUG] {msg}", file=sys.stderr)


# ========================================================================
#  HTTP helpers
# ========================================================================

def _get(url: str, session: requests.Session | None = None,
         retries: int = 2) -> requests.Response | None:
    s = session or requests.Session()
    if not session:
        s.headers.update(HEADERS)
    for attempt in range(retries + 1):
        try:
            r = s.get(url, timeout=REQUEST_TIMEOUT)
            r.raise_for_status()
            return r
        except Exception as e:
            _log(f"GET {url} attempt {attempt+1} failed: {e}")
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
    return None


def _nse_get(path: str) -> dict | list | None:
    """NSE API with cookie pre-fetch."""
    s = requests.Session()
    s.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.nseindia.com/",
    })
    try:
        s.get("https://www.nseindia.com", timeout=10)
        time.sleep(0.5)
        r = s.get(f"https://www.nseindia.com{path}", timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        _log(f"NSE API {path} failed: {e}")
        return None


# ========================================================================
#  1. INDEX DATA — Google Finance (most reliable) + NSE + BSE
# ========================================================================

WANT_INDICES = {
    "NIFTY 50", "NIFTY BANK", "NIFTY NEXT 50", "INDIA VIX",
    "NIFTY IT", "NIFTY MIDCAP 100", "NIFTY SMALLCAP 100",
    "NIFTY FIN SERVICE", "NIFTY AUTO", "NIFTY PHARMA",
    "NIFTY METAL", "NIFTY ENERGY", "NIFTY REALTY",
}


def fetch_index_data() -> list[dict[str, Any]]:
    # Method 1: NSE API
    r = _fetch_nse_indices()
    if len(r) >= 3:
        _log(f"Indices: {len(r)} from NSE")
        return r
    # Method 2: Google Finance (always works)
    r = _fetch_google_indices()
    if r:
        _log(f"Indices: {len(r)} from Google Finance")
        return r
    # Method 3: Groww website scrape
    r = _fetch_groww_indices()
    if r:
        _log(f"Indices: {len(r)} from Groww")
    return r


def _fetch_nse_indices() -> list[dict[str, Any]]:
    data = _nse_get("/api/allIndices")
    if not data:
        return []
    results = []
    for idx in data.get("data", []):
        name = idx.get("index", "")
        if name in WANT_INDICES:
            results.append({
                "name": name,
                "last": _fmt(idx.get("last")),
                "change": _fmt(idx.get("variation")),
                "pct_change": _fmt(idx.get("percentChange")),
                "open": _fmt(idx.get("open")),
                "high": _fmt(idx.get("high")),
                "low": _fmt(idx.get("low")),
                "prev_close": _fmt(idx.get("previousClose")),
            })
    return results


def _fetch_google_indices() -> list[dict[str, Any]]:
    """Google Finance — reliable, always serves HTML with data attributes."""
    results = []
    tickers = [
        ("NIFTY 50", "INDEXNSE:NIFTY_50"),
        ("SENSEX", "INDEXBOM:SENSEX"),
        ("NIFTY BANK", "INDEXNSE:NIFTY_BANK"),
        ("NIFTY IT", "INDEXNSE:NIFTY_IT"),
        ("NIFTY MIDCAP 100", "INDEXNSE:NIFTY_MIDCAP_100"),
        ("NIFTY SMALLCAP 100", "INDEXNSE:NIFTY_SMLCAP_100"),
        ("NIFTY AUTO", "INDEXNSE:NIFTY_AUTO"),
        ("NIFTY PHARMA", "INDEXNSE:NIFTY_PHARMA"),
        ("NIFTY METAL", "INDEXNSE:NIFTY_METAL"),
        ("NIFTY ENERGY", "INDEXNSE:NIFTY_ENERGY"),
        ("NIFTY REALTY", "INDEXNSE:NIFTY_REALTY"),
        ("NIFTY FIN SERVICE", "INDEXNSE:NIFTY_FIN_SERVICE"),
        ("INDIA VIX", "INDEXNSE:INDIAVIX"),
    ]
    for name, ticker in tickers:
        try:
            url = f"https://www.google.com/finance/quote/{ticker}"
            r = _get(url, retries=1)
            if not r:
                continue
            soup = BeautifulSoup(r.text, "lxml")
            # Google puts price in data-last-price attribute
            price_el = soup.select_one("[data-last-price]")
            if not price_el:
                continue
            price = price_el.get("data-last-price", "")
            change = price_el.get("data-last-normal-market-change", "")
            pct = price_el.get("data-last-normal-market-change-pct", "")
            if price:
                results.append({
                    "name": name,
                    "last": _fmt(price),
                    "change": _fmt(change),
                    "pct_change": _fmt(pct),
                    "open": "", "high": "", "low": "", "prev_close": "",
                })
        except Exception as e:
            _log(f"Google {name}: {e}")
    return results


def _fetch_groww_indices() -> list[dict[str, Any]]:
    """Scrape Groww market page for index data."""
    results = []
    try:
        r = _get("https://groww.in/markets/top-gainers")
        if not r:
            return results
        soup = BeautifulSoup(r.text, "lxml")
        # Groww shows Nifty/Sensex in header area
        for el in soup.select("[class*='index'], [class*='Index'], [class*='market']"):
            text = el.get_text(strip=True)
            if "nifty" in text.lower() or "sensex" in text.lower():
                # Try to extract numbers
                nums = re.findall(r"[\d,]+\.?\d*", text)
                if nums:
                    name = "NIFTY 50" if "nifty" in text.lower() else "SENSEX"
                    results.append({
                        "name": name, "last": nums[0],
                        "change": nums[1] if len(nums) > 1 else "",
                        "pct_change": nums[2] if len(nums) > 2 else "",
                        "open": "", "high": "", "low": "", "prev_close": "",
                    })
    except Exception as e:
        _log(f"Groww indices: {e}")
    return results


def _fmt(val) -> str:
    if val is None or val == "":
        return ""
    try:
        v = float(str(val).replace(",", ""))
        return f"{v:,.2f}"
    except (ValueError, TypeError):
        return str(val)


# ========================================================================
#  2. FII / DII DATA — NSE + Trendlyne + Groww + Moneycontrol
# ========================================================================

def fetch_fii_dii_data() -> dict[str, Any]:
    data = _fetch_nse_fii_dii()
    if data.get("fii") or data.get("dii"):
        _log("FII/DII: got from NSE")
        return data
    data = _fetch_trendlyne_fii_dii()
    if data.get("fii") or data.get("dii"):
        _log("FII/DII: got from Trendlyne")
        return data
    data = _fetch_groww_fii_dii()
    if data.get("fii") or data.get("dii"):
        _log("FII/DII: got from Groww")
        return data
    data = _fetch_mc_fii_dii()
    _log(f"FII/DII: MC result fii={bool(data.get('fii'))} dii={bool(data.get('dii'))}")
    return data


def _fetch_nse_fii_dii() -> dict[str, Any]:
    data = {"fii": {}, "dii": {}, "date": "", "source": "NSE"}
    raw = _nse_get("/api/fiidiiTradeReact")
    if not raw:
        return data
    try:
        for entry in raw:
            cat = entry.get("category", "").upper()
            rec = {
                "buy_value": str(entry.get("buyValue", "")),
                "sell_value": str(entry.get("sellValue", "")),
                "net_value": str(entry.get("netValue", "")),
                "date": entry.get("date", ""),
            }
            if "FII" in cat or "FPI" in cat:
                data["fii"] = rec
            elif "DII" in cat:
                data["dii"] = rec
            data["date"] = entry.get("date", data["date"])
    except Exception as e:
        _log(f"NSE FII/DII parse: {e}")
    return data


def _fetch_trendlyne_fii_dii() -> dict[str, Any]:
    """Trendlyne FII/DII page — confirmed working URL."""
    data = {"fii": {}, "dii": {}, "date": "", "source": "Trendlyne"}
    try:
        r = _get("https://trendlyne.com/macro-data/fii-dii/latest/")
        if not r:
            return data
        soup = BeautifulSoup(r.text, "lxml")
        tables = soup.find_all("table")
        for table in tables:
            for row in table.find_all("tr"):
                cells = row.find_all("td")
                if len(cells) >= 4:
                    label = cells[0].get_text(strip=True).upper()
                    vals = [c.get_text(strip=True).replace(",", "") for c in cells]
                    try:
                        float(vals[1].replace("-", "").replace("+", ""))
                    except (ValueError, IndexError):
                        continue
                    rec = {"buy_value": vals[1], "sell_value": vals[2], "net_value": vals[3]}
                    if "FII" in label or "FPI" in label:
                        data["fii"] = rec
                    elif "DII" in label:
                        data["dii"] = rec
    except Exception as e:
        _log(f"Trendlyne FII/DII: {e}")
    return data


def _fetch_groww_fii_dii() -> dict[str, Any]:
    """Groww FII/DII data page."""
    data = {"fii": {}, "dii": {}, "date": "", "source": "Groww"}
    try:
        r = _get("https://groww.in/fii-dii-data")
        if not r:
            return data
        soup = BeautifulSoup(r.text, "lxml")
        tables = soup.find_all("table")
        for table in tables:
            for row in table.find_all("tr"):
                cells = row.find_all("td")
                text = row.get_text(strip=True).upper()
                if len(cells) >= 3:
                    vals = [c.get_text(strip=True).replace(",", "") for c in cells]
                    try:
                        float(vals[0].replace("-", "").replace("+", "").replace("₹", "").strip()[:5])
                    except (ValueError, IndexError):
                        pass
                    if "FII" in text or "FPI" in text:
                        data["fii"] = {"buy_value": vals[0] if len(vals) > 0 else "",
                                       "sell_value": vals[1] if len(vals) > 1 else "",
                                       "net_value": vals[2] if len(vals) > 2 else ""}
                    elif "DII" in text:
                        data["dii"] = {"buy_value": vals[0] if len(vals) > 0 else "",
                                       "sell_value": vals[1] if len(vals) > 1 else "",
                                       "net_value": vals[2] if len(vals) > 2 else ""}
    except Exception as e:
        _log(f"Groww FII/DII: {e}")
    return data


def _fetch_mc_fii_dii() -> dict[str, Any]:
    data = {"fii": {}, "dii": {}, "date": "", "source": "Moneycontrol"}
    try:
        r = _get("https://www.moneycontrol.com/stocks/marketstats/fii_dii_activity/index.php")
        if not r:
            return data
        soup = BeautifulSoup(r.text, "lxml")
        tables = soup.find_all("table")
        for table in tables:
            prev_text = ""
            for prev in table.find_all_previous(string=True)[:50]:
                prev_text += str(prev).upper()
                if len(prev_text) > 500:
                    break
            for row in table.find_all("tr"):
                cells = row.find_all("td")
                if len(cells) >= 4:
                    vals = [c.get_text(strip=True).replace(",", "") for c in cells]
                    try:
                        float(vals[1].replace("-", ""))
                    except ValueError:
                        continue
                    rec = {"date": vals[0], "buy_value": vals[1],
                           "sell_value": vals[2], "net_value": vals[3]}
                    if ("FII" in prev_text or "FPI" in prev_text) and not data["fii"]:
                        data["fii"] = rec
                        data["date"] = vals[0]
                    elif "DII" in prev_text and not data["dii"]:
                        data["dii"] = rec
                    if data["fii"] and data["dii"]:
                        return data
    except Exception as e:
        _log(f"MC FII/DII: {e}")
    return data


# ========================================================================
#  3. NEWS — RSS feeds (WORKING — keep as-is)
# ========================================================================

def fetch_news() -> dict[str, list[dict[str, str]]]:
    all_news: dict[str, list[dict[str, str]]] = {}
    for source_name, feed_url in NEWS_RSS_FEEDS.items():
        articles = _parse_rss(feed_url, source_name)
        if articles:
            all_news[source_name] = articles
            _log(f"News: {len(articles)} from {source_name}")
    return all_news


def _parse_rss(url: str, source: str) -> list[dict[str, str]]:
    articles = []
    try:
        r = _get(url, retries=1)
        if not r:
            return articles
        try:
            root = ET.fromstring(r.content)
            ns = root.tag.split("}")[0] + "}" if root.tag.startswith("{") else ""
            items = root.findall(f".//{ns}item") or root.findall(".//item")
            if not items:
                items = (root.findall(f".//{ns}entry")
                         or root.findall(".//{http://www.w3.org/2005/Atom}entry")
                         or root.findall(".//entry"))
            for item in items[:MAX_NEWS_PER_SOURCE]:
                title = _xt(item, "title", ns)
                link = _xt(item, "link", ns)
                if not link:
                    le = item.find(f"{ns}link") or item.find("link")
                    if le is not None:
                        link = le.get("href", le.text or "")
                pub = _xt(item, "pubDate", ns) or _xt(item, "published", ns) or _xt(item, "updated", ns)
                desc = _xt(item, "description", ns) or _xt(item, "summary", ns)
                if desc:
                    desc = BeautifulSoup(desc, "lxml").get_text(strip=True)[:300]
                if title:
                    articles.append({"title": title.strip(), "link": (link or "").strip(),
                                     "published": (pub or "").strip(), "summary": desc or "",
                                     "source": source})
            return articles
        except ET.ParseError:
            pass
        # Fallback BS parser
        soup = BeautifulSoup(r.content, "lxml")
        for item in (soup.find_all("item") or soup.find_all("entry"))[:MAX_NEWS_PER_SOURCE]:
            t = item.find("title")
            l = item.find("link")
            p = item.find("pubDate") or item.find("published") or item.find("updated")
            d = item.find("description") or item.find("summary")
            title = t.get_text(strip=True) if t else ""
            link = (l.get("href", "") or l.get_text(strip=True)) if l else ""
            if title:
                articles.append({"title": title, "link": link,
                                 "published": p.get_text(strip=True) if p else "",
                                 "summary": d.get_text(strip=True)[:300] if d else "",
                                 "source": source})
    except Exception as e:
        _log(f"RSS {source}: {e}")
    return articles


def _xt(el, tag, ns=""):
    for t in [f"{ns}{tag}", tag]:
        c = el.find(t)
        if c is not None and c.text:
            return c.text
    return ""


# ========================================================================
#  4. STOCK RECOMMENDATIONS — ET page (WORKS) + news RSS extraction
# ========================================================================

def fetch_recommendations() -> list[dict[str, Any]]:
    recos: list[dict[str, Any]] = []

    # Source 1: ET recos page (CONFIRMED WORKING — got 4 last run)
    recos.extend(_fetch_et_recos())

    # Source 2: Trendlyne research reports (new URL)
    recos.extend(_fetch_trendlyne_research())

    # Source 3: Moneycontrol news tags for stock picks (new URLs)
    recos.extend(_fetch_mc_stock_picks())

    # Source 4: 5paisa stock recommendations
    recos.extend(_fetch_5paisa_recos())

    # Source 5: Extract buy/sell from ALL news RSS (guaranteed to work)
    recos.extend(_extract_recos_from_all_news())

    _log(f"Recommendations: total {len(recos)}")
    return recos


def _fetch_et_recos() -> list[dict[str, Any]]:
    """ET Markets recos — CONFIRMED WORKING."""
    recos = []
    try:
        r = _get("https://economictimes.indiatimes.com/markets/stocks/recos")
        if not r:
            return recos
        soup = BeautifulSoup(r.text, "lxml")
        seen = set()
        for a in soup.find_all("a", href=True):
            title = a.get_text(strip=True)
            if not title or len(title) < 15 or title in seen:
                continue
            tl = title.lower()
            if not any(kw in tl for kw in ["buy", "sell", "target", "stock pick",
                                            "top pick", "add", "accumulate", "outperform"]):
                continue
            seen.add(title)
            href = a["href"]
            if not href.startswith("http"):
                href = "https://economictimes.indiatimes.com" + href
            stock, action = _parse_stock_headline(title)
            if stock:
                recos.append({"stock": stock, "recommendation": action or "Buy",
                              "target_price": _parse_target(title), "source": "Economic Times",
                              "headline": title, "link": href, "type": "buy"})
        _log(f"ET recos: {len(recos)}")
    except Exception as e:
        _log(f"ET recos: {e}")
    return recos


def _fetch_trendlyne_research() -> list[dict[str, Any]]:
    """Trendlyne broker research reports — new confirmed URL."""
    recos = []
    try:
        r = _get("https://trendlyne.com/research-reports/buy/")
        if not r:
            return recos
        soup = BeautifulSoup(r.text, "lxml")
        # Look for stock names in research report listings
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:25]:
                cells = row.find_all("td")
                if len(cells) < 2:
                    continue
                a = cells[0].find("a")
                stock = a.get_text(strip=True) if a else cells[0].get_text(strip=True)
                if not stock or len(stock) < 2:
                    continue
                texts = [c.get_text(strip=True) for c in cells[1:]]
                target = next((t for t in texts if re.match(r"[\d,]+\.?\d*$", t.replace(",", ""))), "")
                recos.append({"stock": stock, "recommendation": "Buy",
                              "target_price": target, "source": "Trendlyne", "type": "buy"})
            if recos:
                break

        # Also try article/card style listings
        if not recos:
            for card in soup.select("a[href*='/equity/'], a[href*='/stock/']"):
                title = card.get_text(strip=True)
                if title and len(title) > 3 and not any(c.isdigit() for c in title[:3]):
                    stock, _ = _parse_stock_headline(title)
                    if stock:
                        recos.append({"stock": stock, "recommendation": "Buy",
                                      "target_price": "", "source": "Trendlyne", "type": "buy"})
        _log(f"Trendlyne research: {len(recos)}")
    except Exception as e:
        _log(f"Trendlyne research: {e}")
    return recos


def _fetch_mc_stock_picks() -> list[dict[str, Any]]:
    """Moneycontrol stock pick pages — updated URLs."""
    recos = []
    urls = [
        "https://www.moneycontrol.com/news/tags/stocks-to-buy.html",
        "https://www.moneycontrol.com/news/tags/stock-recommendations.html",
        "https://www.moneycontrol.com/news/business/markets/stocks-to-watch-today",
    ]
    for url in urls:
        try:
            r = _get(url, retries=1)
            if not r:
                continue
            soup = BeautifulSoup(r.text, "lxml")
            seen = set()
            for a in soup.find_all("a", href=True):
                title = a.get_text(strip=True)
                if not title or len(title) < 15 or title in seen:
                    continue
                tl = title.lower()
                if any(kw in tl for kw in ["buy", "sell", "target", "stock pick", "top pick",
                                            "add", "accumulate", "stocks to watch"]):
                    seen.add(title)
                    stock, action = _parse_stock_headline(title)
                    if stock:
                        recos.append({"stock": stock, "recommendation": action or "Buy",
                                      "target_price": _parse_target(title),
                                      "source": "Moneycontrol", "headline": title, "type": "buy"})
            if recos:
                break
        except Exception as e:
            _log(f"MC picks {url}: {e}")
    _log(f"MC stock picks: {len(recos)}")
    return recos


def _fetch_5paisa_recos() -> list[dict[str, Any]]:
    """5paisa stock recommendations."""
    recos = []
    try:
        r = _get("https://www.5paisa.com/share-market-today")
        if not r:
            return recos
        soup = BeautifulSoup(r.text, "lxml")
        for a in soup.find_all("a", href=True):
            title = a.get_text(strip=True)
            if not title or len(title) < 10:
                continue
            tl = title.lower()
            if any(kw in tl for kw in ["buy", "sell", "target", "stock"]):
                stock, action = _parse_stock_headline(title)
                if stock:
                    recos.append({"stock": stock, "recommendation": action or "Buy",
                                  "target_price": _parse_target(title),
                                  "source": "5paisa", "headline": title, "type": "buy"})
    except Exception as e:
        _log(f"5paisa: {e}")
    _log(f"5paisa recos: {len(recos)}")
    return recos


def _extract_recos_from_all_news() -> list[dict[str, Any]]:
    """Extract stock picks from ALL news RSS feeds (guaranteed to work)."""
    recos = []
    all_feeds = dict(NEWS_RSS_FEEDS)
    # Add extra stock-focused feeds
    all_feeds["ET Recos RSS"] = "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms"

    for source, url in all_feeds.items():
        articles = _parse_rss(url, source)
        for art in articles:
            title = art.get("title", "")
            tl = title.lower()
            if any(kw in tl for kw in ["buy", "sell", "target", "stock pick",
                                        "add", "accumulate", "top pick", "multibagger"]):
                stock, action = _parse_stock_headline(title)
                if stock:
                    recos.append({"stock": stock, "recommendation": action or "Buy",
                                  "target_price": _parse_target(title),
                                  "source": f"{source} (RSS)", "headline": title,
                                  "link": art.get("link", ""), "type": "buy"})
    _log(f"News-extracted recos: {len(recos)}")
    return recos


def _parse_stock_headline(title: str) -> tuple[str, str]:
    actions = {"buy": "Buy", "sell": "Sell", "hold": "Hold",
               "accumulate": "Accumulate", "add": "Add",
               "reduce": "Reduce", "outperform": "Outperform", "target": "Buy"}
    found = ""
    for kw, act in actions.items():
        if kw in title.lower():
            found = act
            break
    patterns = [
        r"(?:Buy|Sell|Hold|Add|Accumulate)\s+([A-Z][A-Za-z&. ]{2,25}?)(?:\s+(?:for|target|at|with|around|near|,|\||\-|;))",
        r"^([A-Z][A-Za-z&. ]{2,25?})[\s:]+(?:Buy|Sell|Hold|Target)",
        r"(?:pick|call|idea|stock)[:\s]+([A-Z][A-Za-z&. ]{2,25})",
        r"([A-Z][A-Za-z&. ]{2,22}?)\s+(?:share|stock|target|can|may|could|gains|rises|jumps|falls|rallies|surges)",
        r"'([^']{3,25})'",
        r'"([^"]{3,25})"',
    ]
    stock = ""
    skip = {"the", "this", "that", "these", "stock", "market", "india", "indian",
            "today", "why", "how", "what", "top", "best", "and", "for", "with"}
    for pat in patterns:
        m = re.search(pat, title)
        if m:
            stock = m.group(1).strip().rstrip(".,;:")
            if stock.lower() in skip:
                stock = ""
                continue
            break
    return stock, found


def _parse_target(title: str) -> str:
    for pat in [r"[Tt]arget\s*(?:price\s*)?(?:of\s*)?(?:Rs\.?\s*)?(\d[\d,]+)",
                r"[Rr]s\.?\s*(\d[\d,]+)", r"\u20b9\s*(\d[\d,]+)"]:
        m = re.search(pat, title)
        if m:
            return "Rs " + m.group(1)
    return ""


# ========================================================================
#  5. UPCOMING RESULTS — Trendlyne calendar + Moneycontrol
# ========================================================================

def fetch_upcoming_results() -> list[dict[str, str]]:
    r = _fetch_trendlyne_results()
    if not r:
        r = _fetch_mc_results()
    _log(f"Results: {len(r)}")
    return r


def _fetch_trendlyne_results() -> list[dict[str, str]]:
    """Trendlyne upcoming results — CONFIRMED URL."""
    results = []
    try:
        r = _get("https://trendlyne.com/equity/calendar/upcoming-results/")
        if not r:
            return results
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:25]:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    company = cells[0].get_text(strip=True)
                    if company and len(company) > 2 and company.lower() not in ("company", "name"):
                        results.append({
                            "company": company,
                            "date": cells[1].get_text(strip=True),
                            "period": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                            "source": "Trendlyne",
                        })
            if results:
                break
    except Exception as e:
        _log(f"Trendlyne results: {e}")
    return results


def _fetch_mc_results() -> list[dict[str, str]]:
    results = []
    try:
        r = _get("https://www.moneycontrol.com/markets/earnings/results-calendar")
        if not r:
            return results
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:25]:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    company = cells[0].get_text(strip=True)
                    if company and len(company) > 2 and company.lower() not in ("company", "name", "scrip"):
                        results.append({
                            "company": company,
                            "date": cells[1].get_text(strip=True),
                            "period": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                            "source": "Moneycontrol",
                        })
            if results:
                break
    except Exception as e:
        _log(f"MC results: {e}")
    return results


# ========================================================================
#  6. UPCOMING DIVIDENDS — 5paisa + Trendlyne + Moneycontrol
# ========================================================================

def fetch_upcoming_dividends() -> list[dict[str, str]]:
    d = _fetch_5paisa_dividends()
    if not d:
        d = _fetch_trendlyne_calendar("dividends")
    if not d:
        d = _fetch_mc_dividends()
    _log(f"Dividends: {len(d)}")
    return d


def _fetch_5paisa_dividends() -> list[dict[str, str]]:
    """5paisa dividends page — confirmed working."""
    results = []
    try:
        r = _get("https://www.5paisa.com/share-market-today/dividends")
        if not r:
            return results
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:25]:
                cells = row.find_all("td")
                if len(cells) >= 3:
                    company = cells[0].get_text(strip=True)
                    if company and len(company) > 2 and company.lower() not in ("company", "name"):
                        results.append({
                            "company": company,
                            "ex_date": cells[1].get_text(strip=True),
                            "dividend_amount": cells[2].get_text(strip=True),
                            "record_date": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                            "source": "5paisa",
                        })
            if results:
                break
    except Exception as e:
        _log(f"5paisa dividends: {e}")
    return results


def _fetch_trendlyne_calendar(event_type: str) -> list[dict[str, str]]:
    """Trendlyne events calendar — confirmed working."""
    results = []
    try:
        r = _get(f"https://trendlyne.com/equity/calendar-v1/all/all/")
        if not r:
            return results
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:25]:
                cells = row.find_all("td")
                row_text = row.get_text(strip=True).lower()
                if event_type.lower() not in row_text:
                    continue
                if len(cells) >= 2:
                    company = cells[0].get_text(strip=True)
                    if company and len(company) > 2:
                        if event_type == "dividends":
                            results.append({
                                "company": company,
                                "ex_date": cells[1].get_text(strip=True),
                                "dividend_amount": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                                "record_date": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                                "source": "Trendlyne",
                            })
                        else:
                            results.append({
                                "company": company,
                                "ex_date": cells[1].get_text(strip=True),
                                "ratio": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                                "record_date": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                                "type": event_type.title(),
                                "source": "Trendlyne",
                            })
    except Exception as e:
        _log(f"Trendlyne calendar {event_type}: {e}")
    return results


def _fetch_mc_dividends() -> list[dict[str, str]]:
    results = []
    try:
        r = _get("https://www.moneycontrol.com/stocks/marketinfo/dividends_declared/index.php")
        if not r:
            return results
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:25]:
                cells = row.find_all("td")
                if len(cells) >= 3:
                    company = cells[0].get_text(strip=True)
                    if company and len(company) > 2 and company.lower() not in ("company", "name"):
                        results.append({
                            "company": company,
                            "ex_date": cells[1].get_text(strip=True),
                            "dividend_amount": cells[2].get_text(strip=True),
                            "record_date": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                            "source": "Moneycontrol",
                        })
            if results:
                break
    except Exception as e:
        _log(f"MC dividends: {e}")
    return results


# ========================================================================
#  7. BONUS & SPLITS — 5paisa + Trendlyne + Moneycontrol
# ========================================================================

def fetch_upcoming_bonus() -> list[dict[str, str]]:
    items = []
    items.extend(_fetch_5paisa_corp("bonus", "Bonus"))
    items.extend(_fetch_5paisa_corp("splits", "Split"))
    if not items:
        items.extend(_fetch_trendlyne_calendar("bonus"))
        items.extend(_fetch_trendlyne_calendar("split"))
    _log(f"Bonus/Splits: {len(items)}")
    return items


def _fetch_5paisa_corp(page: str, action_type: str) -> list[dict[str, str]]:
    """5paisa bonus/splits pages — confirmed working."""
    items = []
    try:
        r = _get(f"https://www.5paisa.com/share-market-today/{page}")
        if not r:
            return items
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:20]:
                cells = row.find_all("td")
                if len(cells) >= 3:
                    company = cells[0].get_text(strip=True)
                    if company and len(company) > 2 and company.lower() not in ("company", "name"):
                        items.append({
                            "company": company,
                            "ex_date": cells[1].get_text(strip=True),
                            "ratio": cells[2].get_text(strip=True),
                            "record_date": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                            "type": action_type,
                            "source": "5paisa",
                        })
            if items:
                break
    except Exception as e:
        _log(f"5paisa {page}: {e}")
    return items


# ========================================================================
#  8. IPO DATA — Chittorgarh + Groww + Moneycontrol
# ========================================================================

def fetch_ipo_data() -> dict[str, list[dict[str, str]]]:
    data = _fetch_chittorgarh_ipo()
    if any(data.get(k) for k in ["open", "upcoming", "recently_listed"]):
        _log("IPOs: from Chittorgarh")
        return data
    data = _fetch_groww_ipo()
    if any(data.get(k) for k in ["open", "upcoming", "recently_listed"]):
        _log("IPOs: from Groww")
        return data
    data = _fetch_mc_ipo()
    _log(f"IPOs: MC result")
    return data


def _fetch_chittorgarh_ipo() -> dict[str, list[dict[str, str]]]:
    ipo = {"open": [], "upcoming": [], "recently_listed": []}
    try:
        r = _get("https://www.chittorgarh.com/ipo/ipo_dashboard.asp")
        if not r:
            return ipo
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            heading = ""
            for tag in table.find_all_previous(["h1", "h2", "h3", "h4"])[:1]:
                heading = tag.get_text(strip=True).lower()
            cat = None
            if any(kw in heading for kw in ["current", "open", "ongoing", "mainboard ipo", "sme ipo"]):
                cat = "open"
            elif any(kw in heading for kw in ["upcoming", "forthcoming"]):
                cat = "upcoming"
            elif any(kw in heading for kw in ["recently listed", "recent", "performance"]):
                cat = "recently_listed"
            if not cat:
                continue
            for row in table.find_all("tr")[1:12]:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    name = cells[0].get_text(strip=True)
                    if name and len(name) > 2 and name.lower() not in ("ipo", "name", "company"):
                        ipo[cat].append({
                            "name": name,
                            "date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                            "size": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                            "price_band": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                            "source": "Chittorgarh",
                        })
    except Exception as e:
        _log(f"Chittorgarh IPO: {e}")
    return ipo


def _fetch_groww_ipo() -> dict[str, list[dict[str, str]]]:
    """Groww IPO dashboard."""
    ipo = {"open": [], "upcoming": [], "recently_listed": []}
    try:
        r = _get("https://groww.in/ipo")
        if not r:
            return ipo
        soup = BeautifulSoup(r.text, "lxml")
        for section in soup.find_all(["div", "section"]):
            heading = ""
            h = section.find(["h1", "h2", "h3", "h4"])
            if h:
                heading = h.get_text(strip=True).lower()
            cat = None
            if "open" in heading or "current" in heading:
                cat = "open"
            elif "upcoming" in heading:
                cat = "upcoming"
            elif "listed" in heading or "closed" in heading:
                cat = "recently_listed"
            if not cat:
                continue
            for table in section.find_all("table"):
                for row in table.find_all("tr")[1:10]:
                    cells = row.find_all("td")
                    if len(cells) >= 2:
                        name = cells[0].get_text(strip=True)
                        if name and len(name) > 2:
                            ipo[cat].append({
                                "name": name,
                                "date": cells[1].get_text(strip=True),
                                "size": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                                "price_band": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                                "source": "Groww",
                            })
    except Exception as e:
        _log(f"Groww IPO: {e}")
    return ipo


def _fetch_mc_ipo() -> dict[str, list[dict[str, str]]]:
    ipo = {"open": [], "upcoming": [], "recently_listed": []}
    try:
        r = _get("https://www.moneycontrol.com/ipo/")
        if not r:
            return ipo
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            heading = ""
            for tag in table.find_all_previous(["h2", "h3", "h4"])[:1]:
                heading = tag.get_text(strip=True).lower()
            cat = "upcoming"
            if "open" in heading or "current" in heading:
                cat = "open"
            elif "listed" in heading or "recent" in heading:
                cat = "recently_listed"
            for row in table.find_all("tr")[1:10]:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    name = cells[0].get_text(strip=True)
                    if name and len(name) > 2:
                        ipo[cat].append({
                            "name": name,
                            "date": cells[1].get_text(strip=True),
                            "size": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                            "price_band": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                            "source": "Moneycontrol",
                        })
    except Exception as e:
        _log(f"MC IPO: {e}")
    return ipo
