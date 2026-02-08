"""
Core scraping functions for Indian finance data.
Uses reliable APIs (NSE JSON API, jugaad_data) and robust HTML parsing.
"""

import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from .config import (
    CHITTORGARH_IPO_URL,
    ET_RECOS_URL,
    HEADERS,
    MAX_NEWS_PER_SOURCE,
    MC_BONUS_URL,
    MC_DIVIDENDS_URL,
    MC_FII_DII_URL,
    MC_IPO_URL,
    MC_RESULTS_URL,
    MC_SPLITS_URL,
    MC_TOP_PICKS_URL,
    NEWS_RSS_FEEDS,
    NSE_BASE_URL,
    NSE_FII_DII_URL,
    NSE_INDEX_URL,
    REQUEST_TIMEOUT,
    TRENDLYNE_RECOS_URL,
)


# ========================================================================
#  HTTP helpers
# ========================================================================

def _nse_session() -> requests.Session:
    """Create session with NSE cookies (required for their API)."""
    s = requests.Session()
    s.headers.update(HEADERS)
    s.headers["Referer"] = "https://www.nseindia.com/"
    # NSE requires you to hit the homepage to get cookies first
    try:
        s.get(NSE_BASE_URL, timeout=REQUEST_TIMEOUT)
        time.sleep(0.5)
    except Exception:
        pass
    return s


def _mc_session() -> requests.Session:
    """Create session for Moneycontrol scraping."""
    s = requests.Session()
    s.headers.update(HEADERS)
    s.headers["Referer"] = "https://www.moneycontrol.com/"
    return s


def _get(url: str, session: requests.Session | None = None,
         retries: int = 2) -> requests.Response | None:
    """GET with retries."""
    s = session or requests.Session()
    if not session:
        s.headers.update(HEADERS)
    for attempt in range(retries + 1):
        try:
            r = s.get(url, timeout=REQUEST_TIMEOUT)
            r.raise_for_status()
            return r
        except Exception as e:
            if attempt < retries:
                time.sleep(2 * (attempt + 1))
    return None


# ========================================================================
#  1. INDEX DATA — NSE allIndices API + jugaad_data fallback
# ========================================================================

INDICES_WE_WANT = [
    "NIFTY 50", "NIFTY BANK", "NIFTY NEXT 50", "INDIA VIX",
    "NIFTY IT", "NIFTY MIDCAP 100", "NIFTY SMALLCAP 100",
    "NIFTY FIN SERVICE", "NIFTY AUTO", "NIFTY PHARMA",
    "NIFTY METAL", "NIFTY ENERGY", "NIFTY REALTY",
    "NIFTY INFRA", "NIFTY PSE",
]


def fetch_index_data() -> list[dict[str, Any]]:
    """Fetch key Indian market indices."""
    results = []

    # Method 1: NSE allIndices API
    results = _fetch_nse_indices()
    if results:
        return results

    # Method 2: jugaad_data library
    results = _fetch_jugaad_indices()
    if results:
        return results

    # Method 3: Scrape Moneycontrol market overview
    results = _fetch_mc_indices()
    return results


def _fetch_nse_indices() -> list[dict[str, Any]]:
    results = []
    try:
        session = _nse_session()
        r = session.get(NSE_INDEX_URL, timeout=REQUEST_TIMEOUT)
        r.raise_for_status()
        data = r.json()
        want = set(INDICES_WE_WANT)
        for idx in data.get("data", []):
            name = idx.get("index", "")
            if name in want:
                results.append({
                    "name": name,
                    "last": _fmt_num(idx.get("last")),
                    "change": _fmt_num(idx.get("variation")),
                    "pct_change": _fmt_num(idx.get("percentChange")),
                    "open": _fmt_num(idx.get("open")),
                    "high": _fmt_num(idx.get("high")),
                    "low": _fmt_num(idx.get("low")),
                    "prev_close": _fmt_num(idx.get("previousClose")),
                })
    except Exception:
        pass
    return results


def _fetch_jugaad_indices() -> list[dict[str, Any]]:
    """Use jugaad_data NSELive if available."""
    results = []
    try:
        from jugaad_data.nse import NSELive
        nse = NSELive()
        all_idx = nse.all_indices()
        want = set(INDICES_WE_WANT)
        for idx in all_idx.get("data", []):
            name = idx.get("index", "")
            if name in want:
                results.append({
                    "name": name,
                    "last": _fmt_num(idx.get("last")),
                    "change": _fmt_num(idx.get("variation")),
                    "pct_change": _fmt_num(idx.get("percentChange")),
                    "open": _fmt_num(idx.get("open")),
                    "high": _fmt_num(idx.get("high")),
                    "low": _fmt_num(idx.get("low")),
                    "prev_close": _fmt_num(idx.get("previousClose")),
                })
    except Exception:
        pass
    return results


def _fetch_mc_indices() -> list[dict[str, Any]]:
    """Scrape Moneycontrol market overview as final fallback."""
    results = []
    try:
        r = _get("https://www.moneycontrol.com/stocksmarketsindia/")
        if not r:
            return results
        soup = BeautifulSoup(r.text, "lxml")
        # Moneycontrol shows Sensex, Nifty in hero section
        for div in soup.select(".indicesbox, .index_box, .market_box"):
            name_el = div.select_one(".index_name, .heading, a")
            val_el = div.select_one(".index_val, .value, .last_price")
            chg_el = div.select_one(".index_chg, .change, .pricechange")
            if name_el and val_el:
                results.append({
                    "name": name_el.get_text(strip=True),
                    "last": val_el.get_text(strip=True),
                    "change": chg_el.get_text(strip=True) if chg_el else "",
                    "pct_change": "",
                    "open": "", "high": "", "low": "", "prev_close": "",
                })
    except Exception:
        pass
    return results


def _fmt_num(val) -> str:
    """Format a number for display, return as-is if already string."""
    if val is None:
        return ""
    if isinstance(val, (int, float)):
        return f"{val:,.2f}"
    return str(val)


# ========================================================================
#  2. FII / DII DATA — NSE API + Moneycontrol fallback
# ========================================================================

def fetch_fii_dii_data() -> dict[str, Any]:
    """Fetch FII/DII buy sell data."""
    data = _fetch_nse_fii_dii()
    if data.get("fii") or data.get("dii"):
        return data

    data = _fetch_jugaad_fii_dii()
    if data.get("fii") or data.get("dii"):
        return data

    return _fetch_mc_fii_dii()


def _fetch_nse_fii_dii() -> dict[str, Any]:
    data = {"fii": {}, "dii": {}, "date": "", "source": "NSE"}
    try:
        session = _nse_session()
        r = session.get(NSE_FII_DII_URL, timeout=REQUEST_TIMEOUT)
        r.raise_for_status()
        raw = r.json()
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
    except Exception:
        pass
    return data


def _fetch_jugaad_fii_dii() -> dict[str, Any]:
    data = {"fii": {}, "dii": {}, "date": "", "source": "NSE (jugaad)"}
    try:
        from jugaad_data.nse import NSELive
        nse = NSELive()
        raw = nse.fii_dii()
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
    except Exception:
        pass
    return data


def _fetch_mc_fii_dii() -> dict[str, Any]:
    """Scrape Moneycontrol FII/DII page."""
    data = {"fii": {}, "dii": {}, "date": "", "source": "Moneycontrol"}
    try:
        r = _get(MC_FII_DII_URL)
        if not r:
            return data
        soup = BeautifulSoup(r.text, "lxml")

        # Find ALL tables on the page
        tables = soup.find_all("table")
        for table in tables:
            # Check what's before the table to identify FII vs DII
            prev_text = ""
            for prev in table.find_all_previous(["h2", "h3", "h4", "b", "strong", "th"])[:3]:
                prev_text += prev.get_text(strip=True).upper() + " "

            rows = table.find_all("tr")
            for row in rows:
                cells = row.find_all("td")
                if len(cells) >= 4:
                    vals = [c.get_text(strip=True).replace(",", "") for c in cells]
                    rec = {
                        "date": vals[0],
                        "buy_value": vals[1],
                        "sell_value": vals[2],
                        "net_value": vals[3],
                    }
                    if "FII" in prev_text or "FPI" in prev_text:
                        if not data["fii"]:
                            data["fii"] = rec
                            data["date"] = vals[0]
                    elif "DII" in prev_text:
                        if not data["dii"]:
                            data["dii"] = rec
                    break  # only need the first (latest) data row
    except Exception:
        pass
    return data


# ========================================================================
#  3. NEWS — RSS feeds with robust XML parsing
# ========================================================================

def fetch_news() -> dict[str, list[dict[str, str]]]:
    """Fetch news from multiple RSS feeds."""
    all_news: dict[str, list[dict[str, str]]] = {}

    for source_name, feed_url in NEWS_RSS_FEEDS.items():
        articles = _parse_rss_feed(feed_url, source_name)
        if articles:
            all_news[source_name] = articles

    return all_news


def _parse_rss_feed(url: str, source: str) -> list[dict[str, str]]:
    """Parse an RSS/Atom feed robustly."""
    articles = []
    try:
        r = _get(url)
        if not r:
            return articles

        content = r.content

        # Try XML parser first (proper RSS)
        try:
            root = ET.fromstring(content)
        except ET.ParseError:
            # Fallback to BeautifulSoup for malformed XML
            return _parse_rss_with_bs(content, source)

        # Handle RSS 2.0 (<rss><channel><item>)
        ns = ""
        if root.tag.startswith("{"):
            ns = root.tag.split("}")[0] + "}"

        items = root.findall(f".//{ns}item")
        if not items:
            # Try Atom format (<feed><entry>)
            items = root.findall(f".//{ns}entry")
            if not items:
                # Try with atom namespace
                for atom_ns in ["{http://www.w3.org/2005/Atom}", ""]:
                    items = root.findall(f".//{atom_ns}entry")
                    if items:
                        break

        for item in items[:MAX_NEWS_PER_SOURCE]:
            title = _xml_text(item, "title", ns)
            link = _xml_text(item, "link", ns)
            if not link:
                # Atom style: <link href="..."/>
                link_el = item.find(f"{ns}link")
                if link_el is None:
                    link_el = item.find("{http://www.w3.org/2005/Atom}link")
                if link_el is not None:
                    link = link_el.get("href", "")

            pub_date = (_xml_text(item, "pubDate", ns)
                        or _xml_text(item, "published", ns)
                        or _xml_text(item, "updated", ns)
                        or _xml_text(item, "{http://purl.org/dc/elements/1.1/}date", ""))

            summary = (_xml_text(item, "description", ns)
                       or _xml_text(item, "summary", ns)
                       or _xml_text(item, "content", ns))

            # Clean HTML from summary
            if summary:
                summary = BeautifulSoup(summary, "lxml").get_text(strip=True)[:300]

            if title and title.strip():
                articles.append({
                    "title": title.strip(),
                    "link": link.strip() if link else "",
                    "published": pub_date.strip() if pub_date else "",
                    "summary": summary or "",
                    "source": source,
                })

    except Exception:
        pass
    return articles


def _xml_text(el, tag: str, ns: str = "") -> str:
    """Get text from XML element by tag name."""
    child = el.find(f"{ns}{tag}")
    if child is not None and child.text:
        return child.text
    # Try without namespace
    child = el.find(tag)
    if child is not None and child.text:
        return child.text
    return ""


def _parse_rss_with_bs(content: bytes, source: str) -> list[dict[str, str]]:
    """Fallback RSS parser using BeautifulSoup for malformed feeds."""
    articles = []
    try:
        soup = BeautifulSoup(content, "lxml-xml")
        if not soup:
            soup = BeautifulSoup(content, "lxml")

        items = soup.find_all("item")
        if not items:
            items = soup.find_all("entry")

        for item in items[:MAX_NEWS_PER_SOURCE]:
            title = item.find("title")
            link = item.find("link")
            pub = item.find("pubDate") or item.find("published") or item.find("updated")
            desc = item.find("description") or item.find("summary")

            title_text = title.get_text(strip=True) if title else ""
            link_text = ""
            if link:
                link_text = link.get("href", "") or link.get_text(strip=True)
            pub_text = pub.get_text(strip=True) if pub else ""
            desc_text = desc.get_text(strip=True)[:300] if desc else ""

            if title_text:
                articles.append({
                    "title": title_text,
                    "link": link_text,
                    "published": pub_text,
                    "summary": desc_text,
                    "source": source,
                })
    except Exception:
        pass
    return articles


# ========================================================================
#  4. STOCK RECOMMENDATIONS — Multiple sources
# ========================================================================

def fetch_recommendations() -> list[dict[str, Any]]:
    """Get stock recommendations from multiple sources."""
    all_recos: list[dict[str, Any]] = []

    # Source 1: Moneycontrol analyst recommendations
    all_recos.extend(_fetch_mc_recos())

    # Source 2: Economic Times stock recos
    all_recos.extend(_fetch_et_recos())

    # Source 3: Trendlyne top buy recommendations
    all_recos.extend(_fetch_trendlyne_recos())

    return all_recos


def _fetch_mc_recos() -> list[dict[str, Any]]:
    """Scrape Moneycontrol analyst recommendations page."""
    recos = []
    try:
        session = _mc_session()
        r = _get(MC_TOP_PICKS_URL, session=session)
        if not r:
            return recos

        soup = BeautifulSoup(r.text, "lxml")

        # Moneycontrol has tables with stock name, reco, target, CMP etc.
        # Try multiple table selectors
        tables = soup.find_all("table")

        for table in tables:
            header_row = table.find("tr")
            if not header_row:
                continue
            headers = [th.get_text(strip=True).lower() for th in header_row.find_all(["th", "td"])]

            # Find column indices
            name_col = _find_col(headers, ["company", "stock", "name", "scrip"])
            reco_col = _find_col(headers, ["reco", "recommendation", "call", "action", "rating"])
            target_col = _find_col(headers, ["target", "tp", "price target"])
            cmp_col = _find_col(headers, ["cmp", "price", "ltp", "current"])

            if name_col is None:
                continue

            rows = table.find_all("tr")[1:]  # skip header
            for row in rows[:20]:
                cells = row.find_all("td")
                if len(cells) <= name_col:
                    continue

                stock = cells[name_col].get_text(strip=True)
                if not stock or len(stock) < 2:
                    continue

                reco = cells[reco_col].get_text(strip=True) if reco_col is not None and len(cells) > reco_col else "Buy"
                target = cells[target_col].get_text(strip=True) if target_col is not None and len(cells) > target_col else ""
                cmp = cells[cmp_col].get_text(strip=True) if cmp_col is not None and len(cells) > cmp_col else ""

                recos.append({
                    "stock": stock,
                    "recommendation": reco,
                    "target_price": target,
                    "cmp": cmp,
                    "source": "Moneycontrol",
                    "type": _classify_reco(reco),
                })
    except Exception:
        pass
    return recos


def _fetch_et_recos() -> list[dict[str, Any]]:
    """Scrape Economic Times stock recommendations."""
    recos = []
    try:
        r = _get(ET_RECOS_URL)
        if not r:
            return recos

        soup = BeautifulSoup(r.text, "lxml")

        # ET has article-style listings with headlines containing stock names
        # Try multiple selectors for their layout
        story_links = []

        # Method 1: Story list items
        for a in soup.select("a[href*='/markets/stocks/recos/']"):
            title = a.get_text(strip=True)
            href = a.get("href", "")
            if title and len(title) > 10:
                story_links.append((title, href))

        # Method 2: General article links
        if not story_links:
            for a in soup.select(".eachStory a, .story_list a, .data_list a, article a"):
                title = a.get_text(strip=True)
                href = a.get("href", "")
                if title and len(title) > 10 and any(kw in title.lower() for kw in
                        ["buy", "sell", "target", "stock", "share"]):
                    story_links.append((title, href))

        seen = set()
        for title, href in story_links[:20]:
            if title in seen:
                continue
            seen.add(title)

            if href and not href.startswith("http"):
                href = urljoin("https://economictimes.indiatimes.com", href)

            stock, action = _extract_stock_from_headline(title)
            if stock:
                recos.append({
                    "stock": stock,
                    "recommendation": action or "Buy",
                    "target_price": _extract_target_from_headline(title),
                    "source": "Economic Times",
                    "headline": title,
                    "link": href,
                    "type": _classify_reco(action or "buy"),
                })
    except Exception:
        pass
    return recos


def _fetch_trendlyne_recos() -> list[dict[str, Any]]:
    """Scrape Trendlyne top buy recommendations."""
    recos = []
    try:
        r = _get(TRENDLYNE_RECOS_URL)
        if not r:
            return recos

        soup = BeautifulSoup(r.text, "lxml")

        # Trendlyne shows a table with stock name, buy recos count, target
        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")
            for row in rows[1:20]:
                cells = row.find_all("td")
                if len(cells) < 2:
                    continue

                # First cell usually has stock name (may be in an <a> tag)
                name_cell = cells[0]
                stock_link = name_cell.find("a")
                stock = stock_link.get_text(strip=True) if stock_link else name_cell.get_text(strip=True)

                if not stock or len(stock) < 2:
                    continue

                # Other cells have reco count, target, CMP, etc.
                other_texts = [c.get_text(strip=True) for c in cells[1:]]

                target = ""
                reco_count = ""
                for txt in other_texts:
                    if re.match(r"[\d,]+\.\d{2}", txt.replace(",", "")):
                        if not target:
                            target = txt
                    if re.match(r"\d{1,3}$", txt):
                        reco_count = txt

                recos.append({
                    "stock": stock,
                    "recommendation": f"Buy ({reco_count} analysts)" if reco_count else "Buy",
                    "target_price": target,
                    "source": "Trendlyne",
                    "type": "buy",
                })
    except Exception:
        pass
    return recos


def _find_col(headers: list[str], keywords: list[str]) -> int | None:
    """Find column index matching any keyword."""
    for i, h in enumerate(headers):
        for kw in keywords:
            if kw in h:
                return i
    return None


def _classify_reco(action: str) -> str:
    action_lower = action.lower()
    if any(w in action_lower for w in ["buy", "accumulate", "outperform", "overweight"]):
        return "buy"
    if any(w in action_lower for w in ["sell", "reduce", "underperform", "underweight"]):
        return "sell"
    return "hold"


def _extract_stock_from_headline(title: str) -> tuple[str, str]:
    """Extract stock name and action from headline like 'Buy TCS target Rs 4200'."""
    actions = ["Buy", "Sell", "Hold", "Accumulate", "Reduce",
               "Outperform", "Underperform", "Add", "Target"]
    found_action = ""
    for act in actions:
        if act.lower() in title.lower():
            found_action = act
            break

    # Patterns to extract stock names from headlines
    patterns = [
        # "Buy XYZ Ltd for target..."
        r"(?:Buy|Sell|Hold|Add)\s+([A-Z][A-Za-z&. ]{2,30}?)(?:\s+(?:for|target|at|with|around|near|\||\-))",
        # "XYZ: Buy at..."
        r"^([A-Z][A-Za-z&. ]{2,30?}):\s*(?:Buy|Sell|Hold)",
        # "Stock pick: XYZ Ltd"
        r"(?:pick|call|idea)[:\s]+([A-Z][A-Za-z&. ]{2,30})",
        # Any proper noun before common stock words
        r"([A-Z][A-Za-z&. ]{2,25}?)\s+(?:share|stock|target|can|may|could|jumps|falls|rises|gains)",
        # Quoted names
        r"'([^']{3,30})'",
        r'"([^"]{3,30})"',
    ]
    stock = ""
    for pat in patterns:
        m = re.search(pat, title)
        if m:
            stock = m.group(1).strip().rstrip(".")
            break

    return stock, found_action


def _extract_target_from_headline(title: str) -> str:
    """Extract target price from headline."""
    patterns = [
        r"[Tt]arget\s*(?:price\s*)?(?:of\s*)?(?:Rs\.?\s*)?(\d[\d,]+)",
        r"[Rr]s\.?\s*(\d[\d,]+)",
        r"INR\s*(\d[\d,]+)",
        r"\u20b9\s*(\d[\d,]+)",  # ₹ symbol
    ]
    for pat in patterns:
        m = re.search(pat, title)
        if m:
            return "Rs " + m.group(1)
    return ""


# ========================================================================
#  5. UPCOMING RESULTS
# ========================================================================

def fetch_upcoming_results() -> list[dict[str, str]]:
    """Fetch upcoming quarterly results."""
    results = _fetch_mc_results()
    if not results:
        results = _fetch_trendlyne_results()
    return results


def _fetch_mc_results() -> list[dict[str, str]]:
    """Scrape Moneycontrol earnings calendar."""
    results = []
    try:
        session = _mc_session()
        r = _get(MC_RESULTS_URL, session=session)
        if not r:
            return results

        soup = BeautifulSoup(r.text, "lxml")
        tables = soup.find_all("table")

        for table in tables:
            rows = table.find_all("tr")
            for row in rows[1:25]:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    company = cells[0].get_text(strip=True)
                    # Skip if it looks like a header
                    if not company or company.lower() in ("company", "name", ""):
                        continue
                    results.append({
                        "company": company,
                        "date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                        "period": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                        "source": "Moneycontrol",
                    })
            if results:
                break  # found the right table

    except Exception:
        pass
    return results


def _fetch_trendlyne_results() -> list[dict[str, str]]:
    """Fallback: Trendlyne results calendar."""
    results = []
    try:
        r = _get("https://trendlyne.com/stock-results/upcoming-results/")
        if not r:
            return results
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:25]:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    company = cells[0].get_text(strip=True)
                    if company and len(company) > 2:
                        results.append({
                            "company": company,
                            "date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                            "period": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                            "source": "Trendlyne",
                        })
            if results:
                break
    except Exception:
        pass
    return results


# ========================================================================
#  6. UPCOMING DIVIDENDS
# ========================================================================

def fetch_upcoming_dividends() -> list[dict[str, str]]:
    """Fetch upcoming dividends from Moneycontrol."""
    dividends = []
    try:
        session = _mc_session()
        r = _get(MC_DIVIDENDS_URL, session=session)
        if not r:
            return dividends

        soup = BeautifulSoup(r.text, "lxml")
        tables = soup.find_all("table")

        for table in tables:
            rows = table.find_all("tr")
            for row in rows[1:25]:
                cells = row.find_all("td")
                if len(cells) >= 3:
                    company = cells[0].get_text(strip=True)
                    if not company or company.lower() in ("company", "name"):
                        continue
                    dividends.append({
                        "company": company,
                        "ex_date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                        "dividend_amount": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                        "record_date": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                        "source": "Moneycontrol",
                    })
            if dividends:
                break
    except Exception:
        pass

    # Fallback: Trendlyne
    if not dividends:
        dividends = _fetch_trendlyne_dividends()

    return dividends


def _fetch_trendlyne_dividends() -> list[dict[str, str]]:
    dividends = []
    try:
        r = _get("https://trendlyne.com/stock-screeners/upcoming-dividends/")
        if not r:
            return dividends
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:25]:
                cells = row.find_all("td")
                if len(cells) >= 3:
                    dividends.append({
                        "company": cells[0].get_text(strip=True),
                        "ex_date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                        "dividend_amount": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                        "record_date": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                        "source": "Trendlyne",
                    })
            if dividends:
                break
    except Exception:
        pass
    return dividends


# ========================================================================
#  7. BONUS & STOCK SPLITS
# ========================================================================

def fetch_upcoming_bonus() -> list[dict[str, str]]:
    """Fetch upcoming bonus and splits from Moneycontrol."""
    bonuses = []

    # Bonus
    bonuses.extend(_scrape_mc_corporate_action(MC_BONUS_URL, "Bonus"))

    # Splits
    bonuses.extend(_scrape_mc_corporate_action(MC_SPLITS_URL, "Split"))

    # Fallback
    if not bonuses:
        bonuses = _fetch_trendlyne_bonus()

    return bonuses


def _scrape_mc_corporate_action(url: str, action_type: str) -> list[dict[str, str]]:
    items = []
    try:
        session = _mc_session()
        r = _get(url, session=session)
        if not r:
            return items

        soup = BeautifulSoup(r.text, "lxml")
        tables = soup.find_all("table")
        for table in tables:
            rows = table.find_all("tr")
            for row in rows[1:20]:
                cells = row.find_all("td")
                if len(cells) >= 3:
                    company = cells[0].get_text(strip=True)
                    if not company or company.lower() in ("company", "name"):
                        continue
                    items.append({
                        "company": company,
                        "ex_date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                        "ratio": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                        "record_date": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                        "type": action_type,
                        "source": "Moneycontrol",
                    })
            if items:
                break
    except Exception:
        pass
    return items


def _fetch_trendlyne_bonus() -> list[dict[str, str]]:
    items = []
    try:
        r = _get("https://trendlyne.com/stock-screeners/upcoming-bonus/")
        if not r:
            return items
        soup = BeautifulSoup(r.text, "lxml")
        for table in soup.find_all("table"):
            for row in table.find_all("tr")[1:15]:
                cells = row.find_all("td")
                if len(cells) >= 3:
                    items.append({
                        "company": cells[0].get_text(strip=True),
                        "ex_date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                        "ratio": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                        "record_date": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                        "type": "Bonus",
                        "source": "Trendlyne",
                    })
            if items:
                break
    except Exception:
        pass
    return items


# ========================================================================
#  8. IPO DATA
# ========================================================================

def fetch_ipo_data() -> dict[str, list[dict[str, str]]]:
    """Fetch IPO data from Chittorgarh + Moneycontrol."""
    data = _fetch_chittorgarh_ipo()
    if any(data.get(k) for k in ["open", "upcoming", "recently_listed"]):
        return data
    return _fetch_mc_ipo()


def _fetch_chittorgarh_ipo() -> dict[str, list[dict[str, str]]]:
    ipo = {"open": [], "upcoming": [], "recently_listed": []}
    try:
        r = _get(CHITTORGARH_IPO_URL)
        if not r:
            return ipo

        soup = BeautifulSoup(r.text, "lxml")

        # Chittorgarh structures IPOs in tables under headings
        for table in soup.find_all("table"):
            # Find the nearest heading before this table
            heading = ""
            for tag in table.find_all_previous(["h1", "h2", "h3", "h4"]):
                heading = tag.get_text(strip=True).lower()
                break

            cat = None
            if any(kw in heading for kw in ["current", "open", "ongoing"]):
                cat = "open"
            elif any(kw in heading for kw in ["upcoming", "forthcoming"]):
                cat = "upcoming"
            elif any(kw in heading for kw in ["recently listed", "recent", "listed"]):
                cat = "recently_listed"

            if not cat:
                continue

            for row in table.find_all("tr")[1:12]:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    name = cells[0].get_text(strip=True)
                    if not name or name.lower() in ("ipo", "name", "company"):
                        continue
                    ipo[cat].append({
                        "name": name,
                        "date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                        "size": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                        "price_band": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                        "source": "Chittorgarh",
                    })
    except Exception:
        pass
    return ipo


def _fetch_mc_ipo() -> dict[str, list[dict[str, str]]]:
    ipo = {"open": [], "upcoming": [], "recently_listed": []}
    try:
        session = _mc_session()
        r = _get(MC_IPO_URL, session=session)
        if not r:
            return ipo

        soup = BeautifulSoup(r.text, "lxml")

        for table in soup.find_all("table"):
            heading = ""
            for tag in table.find_all_previous(["h2", "h3", "h4"]):
                heading = tag.get_text(strip=True).lower()
                break

            cat = "upcoming"
            if "open" in heading or "current" in heading:
                cat = "open"
            elif "listed" in heading or "recent" in heading:
                cat = "recently_listed"

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
                            "source": "Moneycontrol",
                        })
    except Exception:
        pass
    return ipo
