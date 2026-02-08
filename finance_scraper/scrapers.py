"""
Core scraping functions for Indian finance data.
Each function targets a specific data source and returns structured data.
"""

import json
import re
import time
from datetime import datetime, timedelta
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from .config import (
    CHITTORGARH_IPO_URL,
    HEADERS,
    MAX_NEWS_PER_SOURCE,
    MONEYCONTROL_FII_URL,
    MONEYCONTROL_RESULTS_URL,
    NEWS_RSS_FEEDS,
    NSE_BASE_URL,
    NSE_FII_DII_URL,
    NSE_INDEX_URL,
    REQUEST_TIMEOUT,
)


def _get_session() -> requests.Session:
    """Create a requests session with proper headers."""
    session = requests.Session()
    session.headers.update(HEADERS)
    return session


def _safe_get(url: str, session: requests.Session | None = None,
              params: dict | None = None, retries: int = 2) -> requests.Response | None:
    """GET with retries and error handling."""
    s = session or _get_session()
    for attempt in range(retries + 1):
        try:
            resp = s.get(url, params=params, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            return resp
        except requests.RequestException:
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
    return None


# ========================================================================
#  1. INDEX DATA (Nifty 50, Sensex, Bank Nifty, etc.)
# ========================================================================

def fetch_index_data() -> list[dict[str, Any]]:
    """Fetch key Indian market indices from NSE."""
    indices_of_interest = {
        "NIFTY 50", "NIFTY BANK", "NIFTY NEXT 50", "INDIA VIX",
        "NIFTY IT", "NIFTY MIDCAP 100", "NIFTY SMALLCAP 100",
        "NIFTY FIN SERVICE", "NIFTY AUTO", "NIFTY PHARMA",
        "NIFTY METAL", "NIFTY ENERGY", "NIFTY REALTY",
        "NIFTY INFRA", "NIFTY PSE",
    }
    results = []

    # --- Try NSE API ---
    session = _get_session()
    # NSE requires cookies from the main page first
    try:
        session.get(NSE_BASE_URL, timeout=REQUEST_TIMEOUT)
        resp = _safe_get(NSE_INDEX_URL, session=session)
        if resp:
            data = resp.json().get("data", [])
            for idx in data:
                name = idx.get("index", "")
                if name in indices_of_interest:
                    results.append({
                        "name": name,
                        "last": idx.get("last", ""),
                        "change": idx.get("variation", ""),
                        "pct_change": idx.get("percentChange", ""),
                        "open": idx.get("open", ""),
                        "high": idx.get("high", ""),
                        "low": idx.get("low", ""),
                        "prev_close": idx.get("previousClose", ""),
                    })
    except Exception:
        pass

    # --- Fallback: scrape Google Finance ---
    if not results:
        results = _fallback_index_data()

    return results


def _fallback_index_data() -> list[dict[str, Any]]:
    """Fallback index data from Google Finance / web search."""
    symbols = {
        "NIFTY 50": "INDEXNSE:NIFTY_50",
        "NIFTY BANK": "INDEXNSE:NIFTY_BANK",
        "SENSEX": "INDEXBOM:SENSEX",
    }
    results = []
    session = _get_session()
    for name, symbol in symbols.items():
        url = f"https://www.google.com/finance/quote/{symbol}"
        resp = _safe_get(url, session=session)
        if resp:
            soup = BeautifulSoup(resp.text, "lxml")
            price_el = soup.select_one("[data-last-price]")
            change_el = soup.select_one("[data-currency-code]")
            price = price_el.get("data-last-price", "N/A") if price_el else "N/A"
            results.append({
                "name": name,
                "last": price,
                "change": "",
                "pct_change": "",
                "open": "",
                "high": "",
                "low": "",
                "prev_close": "",
            })
    return results


# ========================================================================
#  2. FII / DII ACTIVITY
# ========================================================================

def fetch_fii_dii_data() -> dict[str, Any]:
    """Fetch FII and DII buy/sell data."""
    data = {"fii": {}, "dii": {}, "date": "", "source": ""}

    # --- Try NSE API ---
    session = _get_session()
    try:
        session.get(NSE_BASE_URL, timeout=REQUEST_TIMEOUT)
        resp = _safe_get(NSE_FII_DII_URL, session=session)
        if resp:
            raw = resp.json()
            for entry in raw:
                category = entry.get("category", "").upper()
                record = {
                    "buy_value": entry.get("buyValue", ""),
                    "sell_value": entry.get("sellValue", ""),
                    "net_value": entry.get("netValue", ""),
                    "date": entry.get("date", ""),
                }
                if "FII" in category or "FPI" in category:
                    data["fii"] = record
                elif "DII" in category:
                    data["dii"] = record
                data["date"] = entry.get("date", data["date"])
            data["source"] = "NSE"
            if data["fii"] or data["dii"]:
                return data
    except Exception:
        pass

    # --- Fallback: Moneycontrol ---
    data = _fallback_fii_dii_moneycontrol()
    return data


def _fallback_fii_dii_moneycontrol() -> dict[str, Any]:
    """Scrape FII/DII data from Moneycontrol."""
    data = {"fii": {}, "dii": {}, "date": "", "source": "Moneycontrol"}
    resp = _safe_get(MONEYCONTROL_FII_URL)
    if not resp:
        return data

    soup = BeautifulSoup(resp.text, "lxml")
    tables = soup.select("table.tbldata14")

    def _parse_row(cells):
        vals = [c.get_text(strip=True).replace(",", "") for c in cells]
        if len(vals) >= 4:
            return {
                "date": vals[0],
                "buy_value": vals[1],
                "sell_value": vals[2],
                "net_value": vals[3],
            }
        return {}

    for table in tables:
        heading = table.find_previous(["h2", "h3", "b"])
        heading_text = heading.get_text(strip=True).upper() if heading else ""
        rows = table.select("tr")
        for row in rows[1:2]:  # latest row
            cells = row.select("td")
            parsed = _parse_row(cells)
            if "FII" in heading_text or "FPI" in heading_text:
                data["fii"] = parsed
                data["date"] = parsed.get("date", "")
            elif "DII" in heading_text:
                data["dii"] = parsed
    return data


# ========================================================================
#  3. NEWS FROM MULTIPLE SOURCES
# ========================================================================

def fetch_news() -> dict[str, list[dict[str, str]]]:
    """Fetch news from multiple RSS feeds using BeautifulSoup XML parser."""
    all_news: dict[str, list[dict[str, str]]] = {}

    for source_name, feed_url in NEWS_RSS_FEEDS.items():
        articles = []
        try:
            resp = _safe_get(feed_url)
            if not resp:
                continue
            soup = BeautifulSoup(resp.content, "lxml-xml")
            items = soup.find_all("item")
            if not items:
                # Atom feeds use <entry> instead of <item>
                items = soup.find_all("entry")

            for item in items[:MAX_NEWS_PER_SOURCE]:
                title_el = item.find("title")
                link_el = item.find("link")
                pub_el = item.find("pubDate") or item.find("published") or item.find("updated")
                desc_el = item.find("description") or item.find("summary") or item.find("content")

                title = title_el.get_text(strip=True) if title_el else ""
                # For Atom feeds, link is in href attribute
                if link_el:
                    link = link_el.get("href") or link_el.get_text(strip=True)
                else:
                    link = ""
                pub_date = pub_el.get_text(strip=True) if pub_el else ""
                summary = _clean_html(desc_el.get_text(strip=True) if desc_el else "")

                if title:
                    articles.append({
                        "title": title,
                        "link": link,
                        "published": pub_date,
                        "summary": summary,
                        "source": source_name,
                    })
        except Exception:
            pass
        if articles:
            all_news[source_name] = articles

    return all_news


def _clean_html(text: str) -> str:
    """Strip HTML tags from RSS summary."""
    soup = BeautifulSoup(text, "lxml")
    return soup.get_text(separator=" ", strip=True)[:300]


# ========================================================================
#  4. STOCK RECOMMENDATIONS
# ========================================================================

def fetch_recommendations() -> list[dict[str, Any]]:
    """Aggregate stock recommendations from multiple sources."""
    all_recos: list[dict[str, Any]] = []
    all_recos.extend(_fetch_moneycontrol_recos())
    all_recos.extend(_fetch_et_recos())
    all_recos.extend(_fetch_trendlyne_recos())
    return all_recos


def _fetch_moneycontrol_recos() -> list[dict[str, Any]]:
    """Scrape analyst recommendations from Moneycontrol."""
    recos = []
    url = "https://www.moneycontrol.com/stocks/marketinfo/analyst_rec/index.php"
    resp = _safe_get(url)
    if not resp:
        return recos

    soup = BeautifulSoup(resp.text, "lxml")
    # Moneycontrol "Top Buy" table
    tables = soup.select("table.bsr_table")
    if not tables:
        tables = soup.select("table")

    for table in tables[:2]:
        rows = table.select("tr")
        for row in rows[1:]:
            cells = row.select("td")
            if len(cells) >= 3:
                stock = cells[0].get_text(strip=True)
                reco = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                target = cells[2].get_text(strip=True) if len(cells) > 2 else ""
                if stock and len(stock) > 1:
                    recos.append({
                        "stock": stock,
                        "recommendation": reco,
                        "target_price": target,
                        "source": "Moneycontrol",
                        "type": "buy",
                    })
    return recos


def _fetch_et_recos() -> list[dict[str, Any]]:
    """Scrape stock recommendations from Economic Times."""
    recos = []
    url = "https://economictimes.indiatimes.com/markets/stocks/recos"
    resp = _safe_get(url)
    if not resp:
        return recos

    soup = BeautifulSoup(resp.text, "lxml")
    stories = soup.select(".eachStory, .story_list .each_story, .data_list li")

    for story in stories[:15]:
        title_el = story.select_one("a")
        if not title_el:
            continue
        title = title_el.get_text(strip=True)
        link = title_el.get("href", "")
        if link and not link.startswith("http"):
            link = urljoin("https://economictimes.indiatimes.com", link)

        # Try to extract stock name and action from title
        stock, action = _parse_reco_title(title)
        if stock:
            recos.append({
                "stock": stock,
                "recommendation": action,
                "target_price": "",
                "source": "Economic Times",
                "headline": title,
                "link": link,
                "type": action.lower() if action else "",
            })
    return recos


def _fetch_trendlyne_recos() -> list[dict[str, Any]]:
    """Scrape buy recommendations from Trendlyne."""
    recos = []
    url = "https://trendlyne.com/stock-screeners/top-buy-recommendations/"
    resp = _safe_get(url)
    if not resp:
        return recos

    soup = BeautifulSoup(resp.text, "lxml")
    rows = soup.select("table tbody tr")
    for row in rows[:15]:
        cells = row.select("td")
        if len(cells) >= 3:
            stock = cells[0].get_text(strip=True)
            reco_count = cells[1].get_text(strip=True) if len(cells) > 1 else ""
            target = cells[2].get_text(strip=True) if len(cells) > 2 else ""
            if stock and len(stock) > 1:
                recos.append({
                    "stock": stock,
                    "recommendation": f"{reco_count} analysts recommend Buy",
                    "target_price": target,
                    "source": "Trendlyne",
                    "type": "buy",
                })
    return recos


def _parse_reco_title(title: str) -> tuple[str, str]:
    """Extract stock name and buy/sell action from a recommendation headline."""
    actions = ["Buy", "Sell", "Hold", "Accumulate", "Reduce", "Outperform", "Underperform"]
    title_upper = title.upper()
    found_action = ""
    for act in actions:
        if act.upper() in title_upper:
            found_action = act
            break

    # Try to extract stock name (usually the first quoted or capitalized entity)
    patterns = [
        r"(?:Buy|Sell|Hold|Target)\s+(?:for\s+)?([A-Z][A-Za-z& ]+?)(?:\s+(?:at|for|target|with))",
        r"([A-Z][A-Z&. ]{2,30})(?:\s*(?:share|stock|can|may|could|target))",
        r"'([^']+)'",
        r'"([^"]+)"',
    ]
    stock = ""
    for pat in patterns:
        m = re.search(pat, title, re.IGNORECASE)
        if m:
            stock = m.group(1).strip()
            break

    return stock, found_action


# ========================================================================
#  5. UPCOMING RESULTS / EARNINGS CALENDAR
# ========================================================================

def fetch_upcoming_results() -> list[dict[str, str]]:
    """Fetch upcoming quarterly results calendar."""
    results = []

    # --- Moneycontrol earnings calendar ---
    resp = _safe_get(MONEYCONTROL_RESULTS_URL)
    if resp:
        soup = BeautifulSoup(resp.text, "lxml")
        table = soup.select_one("table.tbldata14, table.mctable1, table.bsr_table")
        if table:
            rows = table.select("tr")
            for row in rows[1:20]:
                cells = row.select("td")
                if len(cells) >= 2:
                    results.append({
                        "company": cells[0].get_text(strip=True),
                        "date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                        "period": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                        "source": "Moneycontrol",
                    })

    # --- Fallback: BSE API ---
    if not results:
        results = _fetch_bse_results_calendar()

    return results


def _fetch_bse_results_calendar() -> list[dict[str, str]]:
    """Fetch results calendar from BSE."""
    results = []
    today = datetime.now()
    params = {
        "Atea": "Result",
        "Atea1": "Board Meeting",
        "fromdate": today.strftime("%Y%m%d"),
        "todate": (today + timedelta(days=30)).strftime("%Y%m%d"),
    }
    resp = _safe_get("https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w", params=params)
    if resp:
        try:
            data = resp.json()
            if isinstance(data, dict):
                data = data.get("Table", [])
            for item in data[:20]:
                results.append({
                    "company": item.get("SLONGNAME", item.get("COMPANY_NAME", "")),
                    "date": item.get("NEWS_DT", ""),
                    "period": item.get("NEWSSUB", ""),
                    "source": "BSE",
                })
        except Exception:
            pass
    return results


# ========================================================================
#  6. UPCOMING DIVIDENDS
# ========================================================================

def fetch_upcoming_dividends() -> list[dict[str, str]]:
    """Fetch upcoming dividend announcements."""
    dividends = []

    # --- BSE corporate actions API ---
    today = datetime.now()
    params = {
        "Atea": "Dividend",
        "fromdate": today.strftime("%Y%m%d"),
        "todate": (today + timedelta(days=60)).strftime("%Y%m%d"),
    }
    resp = _safe_get("https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w", params=params)
    if resp:
        try:
            data = resp.json()
            if isinstance(data, dict):
                data = data.get("Table", [])
            for item in data[:20]:
                dividends.append({
                    "company": item.get("SLONGNAME", ""),
                    "ex_date": item.get("EX_DT", ""),
                    "dividend_amount": item.get("NEWSSUB", ""),
                    "record_date": item.get("REC_DT", ""),
                    "source": "BSE",
                })
        except Exception:
            pass

    # --- Fallback: scrape Moneycontrol dividends page ---
    if not dividends:
        dividends = _fallback_dividends()

    return dividends


def _fallback_dividends() -> list[dict[str, str]]:
    """Scrape upcoming dividends from Moneycontrol."""
    dividends = []
    url = "https://www.moneycontrol.com/stocks/marketinfo/dividends_declared/index.php"
    resp = _safe_get(url)
    if not resp:
        return dividends

    soup = BeautifulSoup(resp.text, "lxml")
    table = soup.select_one("table.bsr_table, table.tbldata14")
    if table:
        rows = table.select("tr")
        for row in rows[1:20]:
            cells = row.select("td")
            if len(cells) >= 3:
                dividends.append({
                    "company": cells[0].get_text(strip=True),
                    "ex_date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                    "dividend_amount": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                    "record_date": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                    "source": "Moneycontrol",
                })
    return dividends


# ========================================================================
#  7. BONUS & STOCK SPLITS
# ========================================================================

def fetch_upcoming_bonus() -> list[dict[str, str]]:
    """Fetch upcoming bonus issues and stock splits."""
    bonuses = []

    # --- BSE corporate actions API ---
    today = datetime.now()
    params = {
        "Atea": "Bonus",
        "fromdate": today.strftime("%Y%m%d"),
        "todate": (today + timedelta(days=90)).strftime("%Y%m%d"),
    }
    resp = _safe_get("https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w", params=params)
    if resp:
        try:
            data = resp.json()
            if isinstance(data, dict):
                data = data.get("Table", [])
            for item in data[:15]:
                bonuses.append({
                    "company": item.get("SLONGNAME", ""),
                    "ex_date": item.get("EX_DT", ""),
                    "ratio": item.get("NEWSSUB", ""),
                    "record_date": item.get("REC_DT", ""),
                    "type": "Bonus",
                    "source": "BSE",
                })
        except Exception:
            pass

    # --- Also fetch splits ---
    params["Atea"] = "Split"
    resp = _safe_get("https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w", params=params)
    if resp:
        try:
            data = resp.json()
            if isinstance(data, dict):
                data = data.get("Table", [])
            for item in data[:10]:
                bonuses.append({
                    "company": item.get("SLONGNAME", ""),
                    "ex_date": item.get("EX_DT", ""),
                    "ratio": item.get("NEWSSUB", ""),
                    "record_date": item.get("REC_DT", ""),
                    "type": "Split",
                    "source": "BSE",
                })
        except Exception:
            pass

    if not bonuses:
        bonuses = _fallback_bonus()

    return bonuses


def _fallback_bonus() -> list[dict[str, str]]:
    """Scrape bonus info from Moneycontrol."""
    bonuses = []
    url = "https://www.moneycontrol.com/stocks/marketinfo/bonus/index.php"
    resp = _safe_get(url)
    if not resp:
        return bonuses

    soup = BeautifulSoup(resp.text, "lxml")
    table = soup.select_one("table.bsr_table, table.tbldata14")
    if table:
        rows = table.select("tr")
        for row in rows[1:15]:
            cells = row.select("td")
            if len(cells) >= 3:
                bonuses.append({
                    "company": cells[0].get_text(strip=True),
                    "ex_date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                    "ratio": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                    "record_date": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                    "type": "Bonus",
                    "source": "Moneycontrol",
                })
    return bonuses


# ========================================================================
#  8. IPO DATA
# ========================================================================

def fetch_ipo_data() -> dict[str, list[dict[str, str]]]:
    """Fetch upcoming, open, and recently listed IPOs."""
    ipo_data: dict[str, list[dict[str, str]]] = {
        "upcoming": [],
        "open": [],
        "recently_listed": [],
    }

    resp = _safe_get(CHITTORGARH_IPO_URL)
    if not resp:
        # Fallback
        return _fallback_ipo_data()

    soup = BeautifulSoup(resp.text, "lxml")

    # Parse IPO tables from Chittorgarh
    sections = {
        "open": ["Mainboard IPO", "SME IPO", "Current IPO"],
        "upcoming": ["Upcoming IPO", "Forthcoming IPO"],
        "recently_listed": ["Recently Listed", "Listed IPO"],
    }

    tables = soup.select("table")
    for table in tables:
        heading = table.find_previous(["h2", "h3", "h4"])
        heading_text = heading.get_text(strip=True) if heading else ""

        category = None
        for cat, keywords in sections.items():
            if any(kw.lower() in heading_text.lower() for kw in keywords):
                category = cat
                break

        if not category:
            continue

        rows = table.select("tr")
        for row in rows[1:10]:
            cells = row.select("td")
            if len(cells) >= 3:
                ipo_data[category].append({
                    "name": cells[0].get_text(strip=True),
                    "date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                    "size": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                    "price_band": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                    "source": "Chittorgarh",
                })

    return ipo_data


def _fallback_ipo_data() -> dict[str, list[dict[str, str]]]:
    """Fallback IPO data from Moneycontrol."""
    ipo_data: dict[str, list[dict[str, str]]] = {
        "upcoming": [],
        "open": [],
        "recently_listed": [],
    }
    url = "https://www.moneycontrol.com/ipo/ipo-dashboard"
    resp = _safe_get(url)
    if not resp:
        return ipo_data

    soup = BeautifulSoup(resp.text, "lxml")
    tables = soup.select("table")
    for table in tables[:3]:
        heading = table.find_previous(["h2", "h3"])
        heading_text = heading.get_text(strip=True).lower() if heading else ""
        cat = "upcoming"
        if "open" in heading_text or "current" in heading_text:
            cat = "open"
        elif "listed" in heading_text or "recent" in heading_text:
            cat = "recently_listed"

        rows = table.select("tr")
        for row in rows[1:10]:
            cells = row.select("td")
            if len(cells) >= 2:
                ipo_data[cat].append({
                    "name": cells[0].get_text(strip=True),
                    "date": cells[1].get_text(strip=True) if len(cells) > 1 else "",
                    "size": cells[2].get_text(strip=True) if len(cells) > 2 else "",
                    "price_band": cells[3].get_text(strip=True) if len(cells) > 3 else "",
                    "source": "Moneycontrol",
                })
    return ipo_data
