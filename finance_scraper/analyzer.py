"""
Analysis engine — aggregates recommendations, deduplicates, ranks stocks,
and classifies them into short-term (intraday) vs long-term picks.
"""

import re
from collections import Counter, defaultdict
from typing import Any


def _normalize_stock_name(name: str) -> str:
    """Normalize stock names for deduplication."""
    name = name.upper().strip()
    # Remove common suffixes
    for suffix in [" LTD", " LIMITED", " LTD.", " INC", " CORP", " PLC"]:
        name = name.replace(suffix, "")
    # Remove special characters
    name = re.sub(r"[^A-Z0-9 &]", "", name)
    return name.strip()


def aggregate_recommendations(raw_recos: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Aggregate recommendations from multiple sources.
    Returns:
        {
            "consensus": [
                {"stock": ..., "sources": [...], "count": ..., "recommendation": ..., "targets": [...]},
                ...
            ],
            "by_source": {...},
            "short_term": [...],
            "long_term": [...],
        }
    """
    # Group by normalized stock name
    stock_map: dict[str, dict[str, Any]] = defaultdict(lambda: {
        "stock": "",
        "raw_names": [],
        "sources": [],
        "recommendations": [],
        "targets": [],
        "headlines": [],
        "links": [],
        "types": [],
    })

    for reco in raw_recos:
        stock = reco.get("stock", "").strip()
        if not stock or len(stock) < 2:
            continue

        key = _normalize_stock_name(stock)
        if len(key) < 2:
            continue

        entry = stock_map[key]
        if not entry["stock"]:
            entry["stock"] = stock  # keep the first (most readable) name
        entry["raw_names"].append(stock)
        entry["sources"].append(reco.get("source", ""))
        entry["recommendations"].append(reco.get("recommendation", ""))
        if reco.get("target_price"):
            entry["targets"].append(reco["target_price"])
        if reco.get("headline"):
            entry["headlines"].append(reco["headline"])
        if reco.get("link"):
            entry["links"].append(reco["link"])
        if reco.get("type"):
            entry["types"].append(reco["type"].lower())

    # Build consensus list sorted by number of sources recommending
    consensus = []
    for key, info in stock_map.items():
        unique_sources = list(set(info["sources"]))
        action_counts = Counter(r.lower() for r in info["recommendations"] if r)
        dominant_action = action_counts.most_common(1)[0][0] if action_counts else "buy"

        consensus.append({
            "stock": info["stock"],
            "normalized": key,
            "sources": unique_sources,
            "source_count": len(unique_sources),
            "total_mentions": len(info["sources"]),
            "recommendation": dominant_action.title(),
            "targets": info["targets"],
            "headlines": info["headlines"][:3],
            "links": info["links"][:3],
        })

    # Sort: stocks mentioned by most sources first, then by total mentions
    consensus.sort(key=lambda x: (x["source_count"], x["total_mentions"]), reverse=True)

    # --- Classify short-term vs long-term ---
    short_term = _classify_short_term(consensus, raw_recos)
    long_term = _classify_long_term(consensus, raw_recos)

    # Group by source
    by_source: dict[str, list] = defaultdict(list)
    for reco in raw_recos:
        src = reco.get("source", "Unknown")
        by_source[src].append(reco)

    return {
        "consensus": consensus[:25],
        "by_source": dict(by_source),
        "short_term": short_term[:10],
        "long_term": long_term[:10],
    }


def _classify_short_term(consensus: list[dict], raw_recos: list[dict]) -> list[dict]:
    """
    Identify stocks suitable for short-term / intraday trading.
    Heuristics:
    - Stocks with "intraday" or "short term" in headlines
    - Stocks recommended by multiple sources as buy (momentum)
    - Stocks with specific near-term targets
    """
    short_term_keywords = [
        "intraday", "short term", "short-term", "day trade",
        "swing", "momentum", "breakout", "gap up", "gap down",
        "today", "session", "immediate", "quick",
    ]

    scored: list[tuple[dict, float]] = []
    for item in consensus:
        score = 0.0
        # Check headlines for short-term keywords
        for hl in item.get("headlines", []):
            hl_lower = hl.lower()
            for kw in short_term_keywords:
                if kw in hl_lower:
                    score += 3.0
                    break

        # Multi-source consensus is good for momentum trades
        score += item["source_count"] * 1.0
        score += item["total_mentions"] * 0.3

        # Has specific targets = more actionable
        if item["targets"]:
            score += 1.0

        if item["recommendation"].lower() in ("buy", "outperform", "accumulate"):
            score += 1.0

        scored.append((item, score))

    scored.sort(key=lambda x: x[1], reverse=True)

    return [
        {**item, "short_term_score": round(sc, 1), "trade_type": "Intraday / Short-Term"}
        for item, sc in scored[:10]
    ]


def _classify_long_term(consensus: list[dict], raw_recos: list[dict]) -> list[dict]:
    """
    Identify stocks suitable for long-term investment.
    Heuristics:
    - Stocks with "long term", "multibagger", "wealth creator" in headlines
    - Stocks with strong multi-source consensus
    - Fundamental-sounding recommendations (accumulate, outperform)
    """
    long_term_keywords = [
        "long term", "long-term", "multibagger", "wealth creator",
        "portfolio", "investment", "fundamental", "undervalued",
        "value pick", "quality", "growth", "compounding",
        "accumulate", "hold", "target",
    ]

    scored: list[tuple[dict, float]] = []
    for item in consensus:
        score = 0.0
        for hl in item.get("headlines", []):
            hl_lower = hl.lower()
            for kw in long_term_keywords:
                if kw in hl_lower:
                    score += 3.0
                    break

        # Strong multi-source consensus = conviction pick
        score += item["source_count"] * 1.5
        score += item["total_mentions"] * 0.5

        # Multiple targets = well-researched
        if len(item["targets"]) > 1:
            score += 2.0

        if item["recommendation"].lower() in ("buy", "accumulate", "outperform"):
            score += 1.5

        scored.append((item, score))

    scored.sort(key=lambda x: x[1], reverse=True)

    return [
        {**item, "long_term_score": round(sc, 1), "trade_type": "Long-Term Investment"}
        for item, sc in scored[:10]
    ]


def extract_market_sentiment(news: dict[str, list[dict]]) -> dict[str, Any]:
    """
    Analyze overall market sentiment from news headlines.
    Returns a sentiment summary.
    """
    positive_words = {
        "rally", "surge", "gain", "bull", "bullish", "high", "record",
        "rise", "rising", "up", "soar", "boom", "jump", "recover",
        "green", "positive", "optimistic", "growth", "profit", "buy",
    }
    negative_words = {
        "fall", "crash", "bear", "bearish", "low", "decline", "drop",
        "sell", "selloff", "sell-off", "red", "negative", "fear",
        "loss", "slump", "tank", "plunge", "correction", "weak",
    }

    pos_count = 0
    neg_count = 0
    total = 0

    for source, articles in news.items():
        for article in articles:
            title = article.get("title", "").lower()
            words = set(re.findall(r"\w+", title))
            pos_hits = words & positive_words
            neg_hits = words & negative_words
            pos_count += len(pos_hits)
            neg_count += len(neg_hits)
            total += 1

    if total == 0:
        return {"sentiment": "Neutral", "detail": "No news data available", "score": 0}

    score = (pos_count - neg_count) / max(total, 1)
    if score > 1.0:
        sentiment = "Strongly Bullish"
    elif score > 0.3:
        sentiment = "Bullish"
    elif score > -0.3:
        sentiment = "Neutral"
    elif score > -1.0:
        sentiment = "Bearish"
    else:
        sentiment = "Strongly Bearish"

    return {
        "sentiment": sentiment,
        "score": round(score, 2),
        "positive_signals": pos_count,
        "negative_signals": neg_count,
        "articles_analyzed": total,
    }
