"""
Core scraping functions for Indian finance data.
Uses JSON APIs wherever possible (not HTML scraping) for reliability.
"""

import re
import sys
import time
import traceback
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from .config import HEADERS, MAX_NEWS_PER_SOURCE, NEWS_RSS_FEEDS, REQUEST_TIMEOUT

VERBOSE = True  # print errors to help debug


def _log(msg: str):
    if VERBOSE:
        print(f"  [DEBUG] {msg}", file=sys.stderr)


# ========================================================================
#  HTTP helpers
# ========================================================================

def _get(url: str, session: requests.Session | None = None,
         headers: dict | None = None, retries: int = 2) -> requests.Response | None:
    """GET with retries and error logging."""
    s = session or requests.Session()
    h = headers or HEADERS
    if not session:
        s.headers.update(h)
    for attempt in range(retries + 1):
        try:
            r = s.get(url, timeout=REQUEST_TIMEOUT, headers=h if session else None)
            r.raise_for_status()
            return r
        except Exception as e:
            _log(f"GET {url} attempt {attempt+1} failed: {e}")
            if attempt < retries:
                time.sleep(2 * (attempt + 1))
    return None


def _nse_get(path: str) -> dict | list | None:
    """Hit NSE API with proper cookie/session handling."""
    base = "https://www.nseindia.com"
    api_url = f"{base}{path}"
    s = requests.Session()
    s.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.nseindia.com/",
        "X-Requested-With": "XMLHttpRequest",
        "Connection": "keep-alive",
    })
    try:
        # Step 1: get cookies from homepage
        s.get(base, timeout=REQUEST_TIMEOUT)
        time.sleep(0.3)
        # Step 2: hit API
        r = s.get(api_url, timeout=REQUEST_TIMEOUT)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        _log(f"NSE API {path} failed: {e}")
        return None


# ========================================================================
#  1. INDEX DATA
# ========================================================================

def fetch_index_data() -> list[dict[str, Any]]:
    """Fetch key Indian market indices from multiple sources."""
    results = []

    # Method 1: NSE API (most reliable when it works)
    results = _fetch_nse_indices()
    if len(results) >= 3:
        _log(f"Indices: got {len(results)} from NSE API")
        return results

    # Method 2: Groww API (no auth needed, very reliable)
    results = _fetch_groww_indices()
    if len(results) >= 3:
        _log(f"Indices: got {len(results)} from Groww API")
        return results

    # Method 3: BSE API
    results = _fetch_bse_indices()
    if results:
        _log(f"Indices: got {len(results)} from BSE API")
        return results

    # Method 4: Google Finance scrape
    results = _fetch_google_indices()
    if results:
        _log(f"Indices: got {len(results)} from Google Finance")
    return results


WANT_INDICES = {
    "NIFTY 50", "NIFTY BANK", "NIFTY NEXT 50", "INDIA VIX",
    "NIFTY IT", "NIFTY MIDCAP 100", "NIFTY SMALLCAP 100",
    "NIFTY FIN SERVICE", "NIFTY AUTO", "NIFTY PHARMA",
    "NIFTY METAL", "NIFTY ENERGY", "NIFTY REALTY",
}


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


def _fetch_groww_indices() -> list[dict[str, Any]]:
    """Groww has a public API for index data."""
    results = []
    try:
        url = "https://groww.in/v1/api/stocks_data/v1/accord_points/exchange/NSE/segment/CASH/latest_indices_ohlc"
        r = _get(url)
        if not r:
            return results
        data = r.json()
        # Groww returns a list of indices
        name_map = {
            "NIFTY 50": "NIFTY 50", "NIFTY50": "NIFTY 50",
            "NIFTY BANK": "NIFTY BANK", "BANKNIFTY": "NIFTY BANK",
            "NIFTY IT": "NIFTY IT", "NIFTY NEXT 50": "NIFTY NEXT 50",
            "INDIA VIX": "INDIA VIX",
            "NIFTY MIDCAP 100": "NIFTY MIDCAP 100",
            "NIFTY AUTO": "NIFTY AUTO", "NIFTY PHARMA": "NIFTY PHARMA",
        }
        if isinstance(data, list):
            for idx in data:
                raw_name = idx.get("indexName", idx.get("index", ""))
                name = name_map.get(raw_name, raw_name)
                if name in WANT_INDICES:
                    close = idx.get("close", idx.get("last", 0))
                    prev = idx.get("prevClose", idx.get("previousClose", 0))
                    change = round(close - prev, 2) if close and prev else 0
                    pct = round((change / prev) * 100, 2) if prev else 0
                    results.append({
                        "name": name,
                        "last": _fmt(close),
                        "change": _fmt(change),
                        "pct_change": _fmt(pct),
                        "open": _fmt(idx.get("open", "")),
                        "high": _fmt(idx.get("high", "")),
                        "low": _fmt(idx.get("low", "")),
                        "prev_close": _fmt(prev),
                    })
    except Exception as e:
        _log(f"Groww indices failed: {e}")
    return results


def _fetch_bse_indices() -> list[dict[str, Any]]:
    """BSE India API for Sensex and related indices."""
    results = []
    try:
        url = "https://api.bseindia.com/BseIndiaAPI/api/GetSensexData/w?code=16&flag=0"
        r = _get(url)
        if r:
            data = r.json()
            if isinstance(data, dict):
                results.append({
                    "name": "SENSEX",
                    "last": _fmt(data.get("CurrValue", data.get("ltp", ""))),
                    "change": _fmt(data.get("Chg", "")),
                    "pct_change": _fmt(data.get("PcntChg", "")),
                    "open": _fmt(data.get("Open", "")),
                    "high": _fmt(data.get("High", "")),
                    "low": _fmt(data.get("Low", "")),
                    "prev_close": _fmt(data.get("PrvClose", "")),
                })
    except Exception as e:
        _log(f"BSE indices failed: {e}")

    # Also try BSE broad indices
    try:
        url2 = "https://api.bseindia.com/BseIndiaAPI/api/CompositeIndex/w?code=S&from=&to=&type=Broad"
        r2 = _get(url2)
        if r2:
            for idx in r2.json():
                name = idx.get("indxnm", "")
                results.append({
                    "name": name,
                    "last": _fmt(idx.get("I_val", "")),
                    "change": _fmt(idx.get("I_chg", "")),
                    "pct_change": _fmt(idx.get("I_pchg", "")),
                    "open": "", "high": "", "low": "",
                    "prev_close": _fmt(idx.get("I_prval", "")),
                })
    except Exception as e:
        _log(f"BSE broad indices failed: {e}")
    return results


def _fetch_google_indices() -> list[dict[str, Any]]:
    """Scrape basic index values from Google Finance."""
    results = []
    tickers = {
        "NIFTY 50": "INDEXNSE:NIFTY_50",
        "NIFTY BANK": "INDEXNSE:NIFTY_BANK",
        "SENSEX": "INDEXBOM:SENSEX",
    }
    for name, ticker in tickers.items():
        try:
            url = f"https://www.google.com/finance/quote/{ticker}"
            r = _get(url)
            if not r:
                continue
            soup = BeautifulSoup(r.text, "lxml")
            # Google Finance has data-last-price attribute
            price_el = soup.select_one("[data-last-price]")
            if price_el:
                price = price_el.get("data-last-price", "")
                change = price_el.get("data-last-normal-market-change", "")
                pct = price_el.get("data-last-normal-market-change-pct", "")
                results.append({
                    "name": name,
                    "last": _fmt(price),
                    "change": _fmt(change),
                    "pct_change": _fmt(pct),
                    "open": "", "high": "", "low": "", "prev_close": "",
                })
        except Exception as e:
            _log(f"Google Finance {name} failed: {e}")
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
#  2. FII / DII DATA
# ========================================================================

def fetch_fii_dii_data() -> dict[str, Any]:
    """Fetch FII/DII from multiple sources."""
    # Method 1: NSE API
    data = _fetch_nse_fii_dii()
    if data.get("fii") or data.get("dii"):
        _log("FII/DII: got from NSE API")
        return data

    # Method 2: NSDL website
    data = _fetch_nsdl_fii_dii()
    if data.get("fii") or data.get("dii"):
        _log("FII/DII: got from NSDL")
        return data

    # Method 3: Moneycontrol
    data = _fetch_mc_fii_dii()
    if data.get("fii") or data.get("dii"):
        _log("FII/DII: got from Moneycontrol")
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
        _log(f"NSE FII/DII parse error: {e}")
    return data


def _fetch_nsdl_fii_dii() -> dict[str, Any]:
    """Try NSDL for FII data."""
    data = {"fii": {}, "dii": {}, "date": "", "source": "NSDL"}
    try:
        url = "https://www.fpi.nsdl.co.in/web/StaticReports/Fortnightly/FPIInvestmentDetails.html"
        r = _get(url)
        if not r:
            return data
        soup = BeautifulSoup(r.text, "lxml")
        tables = soup.find_all("table")
        for table in tables:
            for row in table.find_all("tr"):
                cells = row.find_all("td")
                if len(cells) >= 4:
                    label = cells[0].get_text(strip=True).upper()
                    if "EQUITY" in label or "TOTAL" in label:
                        data["fii"] = {
                            "buy_value": cells[1].get_text(strip=True),
                            "sell_value": cells[2].get_text(strip=True),
                            "net_value": cells[3].get_text(strip=True),
                        }
                        break
    except Exception as e:
        _log(f"NSDL FII failed: {e}")
    return data


def _fetch_mc_fii_dii() -> dict[str, Any]:
    """Moneycontrol FII/DII scraping."""
    data = {"fii": {}, "dii": {}, "date": "", "source": "Moneycontrol"}
    try:
        url = "https://www.moneycontrol.com/stocks/marketstats/fii_dii_activity/index.php"
        r = _get(url)
        if not r:
            return data
        soup = BeautifulSoup(r.text, "lxml")

        # Look for all tables and try to identify FII/DII data
        tables = soup.find_all("table")
        for table in tables:
            text_before = ""
            for prev in table.find_all_previous(string=True)[:50]:
                text_before += str(prev).upper()
                if len(text_before) > 500:
                    break

            rows = table.find_all("tr")
            for row in rows:
                cells = row.find_all("td")
                if len(cells) >= 4:
                    vals = [c.get_text(strip=True).replace(",", "") for c in cells]
                    # Check if values look like numbers
                    try:
                        float(vals[1].replace("-", ""))
                    except ValueError:
                        continue

                    rec = {
                        "date": vals[0],
                        "buy_value": vals[1],
                        "sell_value": vals[2],
                        "net_value": vals[3],
                    }
                    if ("FII" in text_before or "FPI" in text_before) and not data["fii"]:
                        data["fii"] = rec
                        data["date"] = vals[0]
                    elif "DII" in text_before and not data["dii"]:
                        data["dii"] = rec
                    if data["fii"] and data["dii"]:
                        return data
    except Exception as e:
        _log(f"MC FII/DII failed: {e}")
    return data


# ========================================================================
#  3. NEWS — RSS feeds (this works, keep it)
# ========================================================================

def fetch_news() -> dict[str, list[dict[str, str]]]:
    """Fetch news from RSS feeds."""
    all_news: dict[str, list[dict[str, str]]] = {}
    for source_name, feed_url in NEWS_RSS_FEEDS.items():
        articles = _parse_rss(feed_url, source_name)
        if articles:
            all_news[source_name] = articles
            _log(f"News: {len(articles)} articles from {source_name}")
    return all_news


def _parse_rss(url: str, source: str) -> list[dict[str, str]]:
    articles = []
    try:
        r = _get(url)
        if not r:
            return articles

        # Try stdlib XML parser first
        try:
            root = ET.fromstring(r.content)
            ns = root.tag.split("}")[0] + "}" if root.tag.startswith("{") else ""
            items = root.findall(f".//{ns}item") or root.findall(f".//item")
            if not items:
                items = (root.findall(f".//{ns}entry")
                         or root.findall(".//{http://www.w3.org/2005/Atom}entry")
                         or root.findall(".//entry"))

            for item in items[:MAX_NEWS_PER_SOURCE]:
                title = _xt(item, "title", ns)
                link = _xt(item, "link", ns)
                if not link:
                    le = item.find(f"{ns}link") or item.find("link") or item.find("{http://www.w3.org/2005/Atom}link")
                    if le is not None:
                        link = le.get("href", le.text or "")
                pub = (_xt(item, "pubDate", ns) or _xt(item, "published", ns)
                       or _xt(item, "updated", ns))
                desc = (_xt(item, "description", ns) or _xt(item, "summary", ns))
                if desc:
                    desc = BeautifulSoup(desc, "lxml").get_text(strip=True)[:300]
                if title:
                    articles.append({"title": title.strip(), "link": (link or "").strip(),
                                     "published": (pub or "").strip(), "summary": desc or "",
                                     "source": source})
            return articles
        except ET.ParseError:
            pass

        # Fallback: BeautifulSoup
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
        _log(f"RSS {source} failed: {e}")
    return articles


def _xt(el, tag, ns=""):
    for t in [f"{ns}{tag}", tag]:
        c = el.find(t)
        if c is not None and c.text:
            return c.text
    return ""


# ========================================================================
#  4. STOCK RECOMMENDATIONS — extract from NEWS + dedicated APIs
# ========================================================================

def fetch_recommendations() -> list[dict[str, Any]]:
    """Get stock recommendations from multiple sources."""
    recos: list[dict[str, Any]] = []

    # Source 1: ET Markets stock recos page
    recos.extend(_fetch_et_recos())

    # Source 2: Moneycontrol stock recos via their JSON/page
    recos.extend(_fetch_mc_recos())

    # Source 3: Trendlyne consensus
    recos.extend(_fetch_trendlyne_recos())

    # Source 4: Extract from news headlines (always works since news works)
    recos.extend(_extract_recos_from_news())

    _log(f"Recommendations: total {len(recos)} collected")
    return recos


def _fetch_et_recos() -> list[dict[str, Any]]:
    """ET Markets recos — scrape article listings."""
    recos = []
    try:
        url = "https://economictimes.indiatimes.com/markets/stocks/recos"
        r = _get(url)
        if not r:
            return recos
        soup = BeautifulSoup(r.text, "lxml")

        # ET uses various link patterns
        seen = set()
        for a in soup.find_all("a", href=True):
            href = a["href"]
            title = a.get_text(strip=True)
            if not title or len(title) < 15:
                continue
            if title in seen:
                continue
            # Filter for stock recommendation articles
            title_lower = title.lower()
            if not any(kw in title_lower for kw in
                       ["buy", "sell", "target", "stock pick", "top pick",
                        "add", "accumulate", "outperform", "hold", "reduce"]):
                continue
            seen.add(title)

            if not href.startswith("http"):
                href = "https://economictimes.indiatimes.com" + href

            stock, action = _parse_stock_headline(title)
            target = _parse_target(title)
            if stock:
                recos.append({
                    "stock": stock, "recommendation": action or "Buy",
                    "target_price": target, "source": "Economic Times",
                    "headline": title, "link": href,
                    "type": "buy" if action.lower() in ("buy", "add", "accumulate", "outperform", "") else "sell",
                })
        _log(f"ET recos: {len(recos)}")
    except Exception as e:
        _log(f"ET recos failed: {e}")
    return recos


def _fetch_mc_recos() -> list[dict[str, Any]]:
    """Moneycontrol stock ideas/recommendations."""
    recos = []
    # Try the research/recommendations listing page
    urls = [
        "https://www.moneycontrol.com/stocks/marketinfo/analyst_rec/index.php",
        "https://www.moneycontrol.com/news/tags/stocks-to-buy.html",
        "https://www.moneycontrol.com/news/tags/stock-recommendations.html",
    ]
    for url in urls:
        try:
            r = _get(url)
            if not r:
                continue
            soup = BeautifulSoup(r.text, "lxml")

            # Try tables first
            for table in soup.find_all("table"):
                header = table.find("tr")
                if not header:
                    continue
                headers = [th.get_text(strip=True).lower() for th in header.find_all(["th", "td"])]
                name_col = _col(headers, ["company", "stock", "name", "scrip"])
                if name_col is None:
                    continue
                reco_col = _col(headers, ["reco", "recommendation", "call", "action"])
                target_col = _col(headers, ["target", "tp"])

                for row in table.find_all("tr")[1:25]:
                    cells = row.find_all("td")
                    if len(cells) <= name_col:
                        continue
                    stock = cells[name_col].get_text(strip=True)
                    if not stock or len(stock) < 2:
                        continue
                    reco_text = cells[reco_col].get_text(strip=True) if reco_col and len(cells) > reco_col else "Buy"
                    target = cells[target_col].get_text(strip=True) if target_col and len(cells) > target_col else ""
                    recos.append({
                        "stock": stock, "recommendation": reco_text,
                        "target_price": target, "source": "Moneycontrol",
                        "type": "buy" if "buy" in reco_text.lower() else "hold",
                    })

            # Try article links (for tags pages)
            if not recos:
                seen = set()
                for a in soup.find_all("a", href=True):
                    title = a.get_text(strip=True)
                    if not title or len(title) < 15 or title in seen:
                        continue
                    title_lower = title.lower()
                    if any(kw in title_lower for kw in ["buy", "sell", "target", "stock pick", "top pick"]):
                        seen.add(title)
                        stock, action = _parse_stock_headline(title)
                        if stock:
                            recos.append({
                                "stock": stock, "recommendation": action or "Buy",
                                "target_price": _parse_target(title),
                                "source": "Moneycontrol", "headline": title,
                                "type": "buy",
                            })

            if recos:
                break
        except Exception as e:
            _log(f"MC recos from {url} failed: {e}")
    _log(f"MC recos: {len(recos)}")
    return recos


def _fetch_trendlyne_recos() -> list[dict[str, Any]]:
    """Trendlyne top buy recommendations."""
    recos = []
    try:
        url = "https://trendlyne.com/stock-screeners/top-buy-recommendations/"
        r = _get(url)
        if not r:
            return recos
        soup = BeautifulSoup(r.text, "lxml")
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
                count = next((t for t in texts if re.match(r"\d{1,3}$", t)), "")
                recos.append({
                    "stock": stock,
                    "recommendation": f"Buy ({count} analysts)" if count else "Buy",
                    "target_price": target, "source": "Trendlyne", "type": "buy",
                })
            if recos:
                break
        _log(f"Trendlyne recos: {len(recos)}")
    except Exception as e:
        _log(f"Trendlyne recos failed: {e}")
    return recos


def _extract_recos_from_news() -> list[dict[str, Any]]:
    """Extract stock recommendations from already-fetched news headlines."""
    recos = []
    # Parse the RSS feeds again quickly for reco-style headlines
    reco_feeds = {
        "ET Stocks": "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms",
        "MC Markets": "https://www.moneycontrol.com/rss/marketreports.xml",
    }
    for source, url in reco_feeds.items():
        articles = _parse_rss(url, source)
        for art in articles:
            title = art.get("title", "")
            title_lower = title.lower()
            if any(kw in title_lower for kw in ["buy", "sell", "target", "stock pick", "add", "accumulate"]):
                stock, action = _parse_stock_headline(title)
                if stock:
                    recos.append({
                        "stock": stock, "recommendation": action or "Buy",
                        "target_price": _parse_target(title),
                        "source": f"{source} (RSS)", "headline": title,
                        "link": art.get("link", ""),
                        "type": "buy" if action.lower() in ("buy", "add", "accumulate", "") else "sell",
                    })
    _log(f"News-extracted recos: {len(recos)}")
    return recos


def _col(headers, keywords):
    for i, h in enumerate(headers):
        for kw in keywords:
            if kw in h:
                return i
    return None


def _parse_stock_headline(title: str) -> tuple[str, str]:
    """Extract stock name and action from headline."""
    actions = {"buy": "Buy", "sell": "Sell", "hold": "Hold",
               "accumulate": "Accumulate", "add": "Add",
               "reduce": "Reduce", "outperform": "Outperform",
               "underperform": "Underperform", "target": "Buy"}
    found = ""
    for kw, act in actions.items():
        if kw in title.lower():
            found = act
            break

    # Extract stock name
    patterns = [
        r"(?:Buy|Sell|Hold|Add|Accumulate)\s+([A-Z][A-Za-z&. ]{2,25}?)(?:\s+(?:for|target|at|with|around|near|,|\||\-|;))",
        r"^([A-Z][A-Za-z&. ]{2,25?})[\s:]+(?:Buy|Sell|Hold|Target)",
        r"(?:pick|call|idea|stock)[:\s]+([A-Z][A-Za-z&. ]{2,25})",
        r"([A-Z][A-Za-z&. ]{2,22}?)\s+(?:share|stock|target|can|may|could|gains|rises|jumps|falls|rallies)",
        r"'([^']{3,25})'",
        r'"([^"]{3,25})"',
    ]
    stock = ""
    for pat in patterns:
        m = re.search(pat, title)
        if m:
            stock = m.group(1).strip().rstrip(".,;:")
            # Filter out common false positives
            if stock.lower() in ("the", "this", "that", "these", "stock", "market",
                                  "india", "indian", "today", "why", "how", "what"):
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
#  5. UPCOMING RESULTS
# ========================================================================

def fetch_upcoming_results() -> list[dict[str, str]]:
    """Fetch upcoming results from multiple sources."""
    results = _fetch_mc_results()
    if not results:
        results = _fetch_bse_results()
    _log(f"Results: {len(results)} companies")
    return results


def _fetch_mc_results() -> list[dict[str, str]]:
    results = []
    try:
        # Moneycontrol results calendar - try the direct page
        url = "https://www.moneycontrol.com/markets/earnings/results-calendar"
        r = _get(url)
        if not r:
            return results
        soup = BeautifulSoup(r.text, "lxml")

        # Find any table with company-like data
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:]:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    company = cells[0].get_text(strip=True)
                    if not company or len(company) < 3:
                        continue
                    if company.lower() in ("company", "name", "scrip", "stock"):
                        continue
                    results.append({
                        "company": company,
                        "date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                        "period": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                        "source": "Moneycontrol",
                    })
            if results:
                break

        # Also try Trendlyne
        if not results:
            url2 = "https://trendlyne.com/stock-results/upcoming-results/"
            r2 = _get(url2)
            if r2:
                soup2 = BeautifulSoup(r2.text, "lxml")
                for table in soup2.find_all("table"):
                    for row in table.find_all("tr")[1:]:
                        cells = row.find_all("td")
                        if len(cells) >= 2:
                            company = cells[0].get_text(strip=True)
                            if company and len(company) > 2:
                                results.append({
                                    "company": company,
                                    "date": cells[1].get_text(strip=True),
                                    "period": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                                    "source": "Trendlyne",
                                })
                    if results:
                        break
    except Exception as e:
        _log(f"MC results failed: {e}")
    return results


def _fetch_bse_results() -> list[dict[str, str]]:
    """BSE board meetings API."""
    results = []
    try:
        today = datetime.now()
        from_dt = today.strftime("%Y%m%d")
        to_dt = (today + timedelta(days=30)).strftime("%Y%m%d")
        url = f"https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?Atea=Result&fromdate={from_dt}&todate={to_dt}"
        r = _get(url)
        if r:
            data = r.json()
            items = data.get("Table", data) if isinstance(data, dict) else data
            if isinstance(items, list):
                for item in items[:25]:
                    results.append({
                        "company": item.get("SLONGNAME", item.get("COMPANY_NAME", "")),
                        "date": item.get("NEWS_DT", ""),
                        "period": item.get("NEWSSUB", ""),
                        "source": "BSE",
                    })
    except Exception as e:
        _log(f"BSE results failed: {e}")
    return results


# ========================================================================
#  6. UPCOMING DIVIDENDS
# ========================================================================

def fetch_upcoming_dividends() -> list[dict[str, str]]:
    """Fetch upcoming dividends."""
    divs = _fetch_bse_corp_action("Dividend")
    if not divs:
        divs = _fetch_mc_dividends()
    _log(f"Dividends: {len(divs)} companies")
    return divs


def _fetch_bse_corp_action(action_type: str) -> list[dict[str, str]]:
    """BSE corporate actions API (works for Dividend, Bonus, Split)."""
    results = []
    try:
        today = datetime.now()
        from_dt = today.strftime("%Y%m%d")
        to_dt = (today + timedelta(days=90)).strftime("%Y%m%d")
        url = f"https://api.bseindia.com/BseIndiaAPI/api/DefaultData/w?Atea={action_type}&Atea1=&fromdate={from_dt}&todate={to_dt}&strType=C"
        r = _get(url)
        if not r:
            # Try alternate endpoint
            url2 = f"https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?Atea={action_type}&fromdate={from_dt}&todate={to_dt}"
            r = _get(url2)
        if r:
            data = r.json()
            items = data.get("Table", data) if isinstance(data, dict) else data
            if isinstance(items, list):
                for item in items[:25]:
                    if action_type == "Dividend":
                        results.append({
                            "company": item.get("scrip_name", item.get("SLONGNAME", item.get("COMPANY_NAME", ""))),
                            "ex_date": item.get("Ex_date", item.get("EX_DT", "")),
                            "dividend_amount": item.get("PURPOSE", item.get("NEWSSUB", "")),
                            "record_date": item.get("Record_date", item.get("REC_DT", "")),
                            "source": "BSE",
                        })
                    else:
                        results.append({
                            "company": item.get("scrip_name", item.get("SLONGNAME", "")),
                            "ex_date": item.get("Ex_date", item.get("EX_DT", "")),
                            "ratio": item.get("PURPOSE", item.get("NEWSSUB", "")),
                            "record_date": item.get("Record_date", item.get("REC_DT", "")),
                            "type": action_type,
                            "source": "BSE",
                        })
    except Exception as e:
        _log(f"BSE {action_type} failed: {e}")
    return results


def _fetch_mc_dividends() -> list[dict[str, str]]:
    results = []
    try:
        url = "https://www.moneycontrol.com/stocks/marketinfo/dividends_declared/index.php"
        r = _get(url)
        if not r:
            return results
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:]:
                cells = row.find_all("td")
                if len(cells) >= 3:
                    company = cells[0].get_text(strip=True)
                    if not company or len(company) < 3 or company.lower() in ("company", "name"):
                        continue
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
        _log(f"MC dividends failed: {e}")
    return results


# ========================================================================
#  7. BONUS & SPLITS
# ========================================================================

def fetch_upcoming_bonus() -> list[dict[str, str]]:
    """Fetch upcoming bonus and splits."""
    items = []
    items.extend(_fetch_bse_corp_action("Bonus"))
    items.extend(_fetch_bse_corp_action("Split"))

    if not items:
        # MC fallback
        for url, atype in [
            ("https://www.moneycontrol.com/stocks/marketinfo/bonus/index.php", "Bonus"),
            ("https://www.moneycontrol.com/stocks/marketinfo/splits/index.php", "Split"),
        ]:
            try:
                r = _get(url)
                if not r:
                    continue
                soup = BeautifulSoup(r.text, "lxml")
                for table in soup.find_all("table"):
                    for row in table.find_all("tr")[1:]:
                        cells = row.find_all("td")
                        if len(cells) >= 3:
                            company = cells[0].get_text(strip=True)
                            if company and len(company) > 2 and company.lower() not in ("company", "name"):
                                items.append({
                                    "company": company,
                                    "ex_date": cells[1].get_text(strip=True),
                                    "ratio": cells[2].get_text(strip=True),
                                    "record_date": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                                    "type": atype,
                                    "source": "Moneycontrol",
                                })
                    if items:
                        break
            except Exception as e:
                _log(f"MC {atype} failed: {e}")

    _log(f"Bonus/Splits: {len(items)} items")
    return items


# ========================================================================
#  8. IPO DATA
# ========================================================================

def fetch_ipo_data() -> dict[str, list[dict[str, str]]]:
    """Fetch IPO data."""
    data = _fetch_investorgain_ipo()
    if any(data.get(k) for k in ["open", "upcoming", "recently_listed"]):
        _log("IPOs: got from InvestorGain")
        return data

    data = _fetch_chittorgarh_ipo()
    if any(data.get(k) for k in ["open", "upcoming", "recently_listed"]):
        _log("IPOs: got from Chittorgarh")
        return data

    _log("IPOs: no data from any source")
    return {"open": [], "upcoming": [], "recently_listed": []}


def _fetch_investorgain_ipo() -> dict[str, list[dict[str, str]]]:
    """InvestorGain IPO page (simpler HTML than Chittorgarh)."""
    ipo = {"open": [], "upcoming": [], "recently_listed": []}
    try:
        r = _get("https://www.investorgain.com/ipo")
        if not r:
            return ipo
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            heading = ""
            for tag in table.find_all_previous(["h1", "h2", "h3", "h4", "h5"])[:1]:
                heading = tag.get_text(strip=True).lower()

            cat = None
            if any(kw in heading for kw in ["open", "current", "ongoing", "live"]):
                cat = "open"
            elif any(kw in heading for kw in ["upcoming", "forthcoming", "future"]):
                cat = "upcoming"
            elif any(kw in heading for kw in ["listed", "recent", "closed"]):
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
                            "source": "InvestorGain",
                        })
    except Exception as e:
        _log(f"InvestorGain IPO failed: {e}")
    return ipo


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
            if any(kw in heading for kw in ["current", "open", "ongoing"]):
                cat = "open"
            elif any(kw in heading for kw in ["upcoming", "forthcoming"]):
                cat = "upcoming"
            elif any(kw in heading for kw in ["recently listed", "recent"]):
                cat = "recently_listed"
            if not cat:
                continue
            for row in table.find_all("tr")[1:12]:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    name = cells[0].get_text(strip=True)
                    if name and len(name) > 2:
                        ipo[cat].append({
                            "name": name,
                            "date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                            "size": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                            "price_band": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                            "source": "Chittorgarh",
                        })
    except Exception as e:
        _log(f"Chittorgarh IPO failed: {e}")
    return ipo
