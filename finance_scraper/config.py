"""
Configuration for finance scraper - data source URLs and settings.
"""

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

REQUEST_TIMEOUT = 15  # seconds

# ---------------------------------------------------------------------------
# NSE / BSE index & market data
# ---------------------------------------------------------------------------
NSE_INDEX_URL = "https://www.nseindia.com/api/allIndices"
NSE_MARKET_STATUS_URL = "https://www.nseindia.com/api/marketStatus"
NSE_FII_DII_URL = "https://www.nseindia.com/api/fiidiiTradeReact"
NSE_BASE_URL = "https://www.nseindia.com"

# ---------------------------------------------------------------------------
# News RSS feeds (multiple sources for cross-referencing)
# ---------------------------------------------------------------------------
NEWS_RSS_FEEDS = {
    "Moneycontrol": "https://www.moneycontrol.com/rss/MCtopnews.xml",
    "Moneycontrol_Markets": "https://www.moneycontrol.com/rss/marketreports.xml",
    "Economic_Times_Markets": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    "Economic_Times_Stocks": "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms",
    "LiveMint": "https://www.livemint.com/rss/markets",
    "NDTV_Profit": "https://feeds.feedburner.com/ndtvprofit-latest",
    "Business_Standard": "https://www.business-standard.com/rss/markets-106.rss",
}

# ---------------------------------------------------------------------------
# Stock recommendation sources (web scraping targets)
# ---------------------------------------------------------------------------
RECOMMENDATION_SOURCES = {
    "Moneycontrol_Ideas": "https://www.moneycontrol.com/stocks/marketinfo/analyst_rec/index.php",
    "ET_Recos": "https://economictimes.indiatimes.com/markets/stocks/recos",
    "Trendlyne_Ideas": "https://trendlyne.com/stock-screeners/top-buy-recommendations/",
}

# ---------------------------------------------------------------------------
# Corporate actions (results, dividends, bonuses, IPOs)
# ---------------------------------------------------------------------------
BSE_CORP_ACTIONS_URL = "https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w"
MONEYCONTROL_RESULTS_URL = "https://www.moneycontrol.com/markets/earnings/results-calendar"
CHITTORGARH_IPO_URL = "https://www.chittorgarh.com/ipo/ipo_dashboard.asp"

# ---------------------------------------------------------------------------
# FII / DII activity
# ---------------------------------------------------------------------------
MONEYCONTROL_FII_URL = "https://www.moneycontrol.com/stocks/marketstats/fii_dii_activity/index.php"
TRENDLYNE_FII_URL = "https://trendlyne.com/fii-dii-activity/"

# ---------------------------------------------------------------------------
# Display settings
# ---------------------------------------------------------------------------
MAX_NEWS_PER_SOURCE = 8
MAX_RECOMMENDATIONS = 25
