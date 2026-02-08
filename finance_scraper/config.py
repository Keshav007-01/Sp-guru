"""
Configuration for finance scraper - data source URLs and settings.
"""

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
}

REQUEST_TIMEOUT = 20  # seconds

# ---------------------------------------------------------------------------
# NSE APIs (require cookie from homepage first)
# ---------------------------------------------------------------------------
NSE_BASE_URL = "https://www.nseindia.com"
NSE_INDEX_URL = "https://www.nseindia.com/api/allIndices"
NSE_FII_DII_URL = "https://www.nseindia.com/api/fiidiiTradeReact"

# ---------------------------------------------------------------------------
# News RSS feeds
# ---------------------------------------------------------------------------
NEWS_RSS_FEEDS = {
    "Moneycontrol": "https://www.moneycontrol.com/rss/MCtopnews.xml",
    "Moneycontrol Markets": "https://www.moneycontrol.com/rss/marketreports.xml",
    "ET Markets": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    "ET Stocks": "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms",
    "LiveMint": "https://www.livemint.com/rss/markets",
    "Business Standard": "https://www.business-standard.com/rss/markets-106.rss",
}

# ---------------------------------------------------------------------------
# Moneycontrol pages (reliable scraping targets)
# ---------------------------------------------------------------------------
MC_TOP_PICKS_URL = "https://www.moneycontrol.com/stocks/marketinfo/analyst_rec/index.php"
MC_RESULTS_URL = "https://www.moneycontrol.com/markets/earnings/results-calendar"
MC_DIVIDENDS_URL = "https://www.moneycontrol.com/stocks/marketinfo/dividends_declared/index.php"
MC_BONUS_URL = "https://www.moneycontrol.com/stocks/marketinfo/bonus/index.php"
MC_SPLITS_URL = "https://www.moneycontrol.com/stocks/marketinfo/splits/index.php"
MC_IPO_URL = "https://www.moneycontrol.com/ipo/ipo-dashboard"
MC_FII_DII_URL = "https://www.moneycontrol.com/stocks/marketstats/fii_dii_activity/index.php"

# ---------------------------------------------------------------------------
# Trendlyne
# ---------------------------------------------------------------------------
TRENDLYNE_RECOS_URL = "https://trendlyne.com/stock-screeners/top-buy-recommendations/"

# ---------------------------------------------------------------------------
# Chittorgarh IPO
# ---------------------------------------------------------------------------
CHITTORGARH_IPO_URL = "https://www.chittorgarh.com/ipo/ipo_dashboard.asp"

# ---------------------------------------------------------------------------
# ET stock recos
# ---------------------------------------------------------------------------
ET_RECOS_URL = "https://economictimes.indiatimes.com/markets/stocks/recos"

# ---------------------------------------------------------------------------
# Display settings
# ---------------------------------------------------------------------------
MAX_NEWS_PER_SOURCE = 10
MAX_RECOMMENDATIONS = 30
