"""
Report generator — formats all scraped & analyzed data into a beautiful
terminal report using the `rich` library, and optionally saves to HTML/text.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.columns import Columns
from rich.markdown import Markdown
from rich import box


console = Console(record=True, width=120)


def generate_report(data: dict[str, Any]) -> None:
    """Generate and print the full market report."""
    _print_header()
    _print_market_sentiment(data.get("sentiment", {}))
    _print_index_data(data.get("indices", []))
    _print_fii_dii(data.get("fii_dii", {}))
    _print_top_news(data.get("news", {}))
    _print_consensus_recommendations(data.get("recommendations", {}))
    _print_short_term_picks(data.get("recommendations", {}))
    _print_long_term_picks(data.get("recommendations", {}))
    _print_upcoming_results(data.get("results", []))
    _print_upcoming_dividends(data.get("dividends", []))
    _print_bonus_and_splits(data.get("bonus", []))
    _print_ipo_section(data.get("ipos", {}))
    _print_disclaimer()


def save_report(data: dict[str, Any], output_dir: str = "output") -> dict[str, str]:
    """Save the report in multiple formats."""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Save raw JSON
    json_path = out / f"market_report_{timestamp}.json"
    with open(json_path, "w") as f:
        json.dump(data, f, indent=2, default=str)

    # Save HTML (from rich console recording)
    html_path = out / f"market_report_{timestamp}.html"
    html_content = console.export_html()
    with open(html_path, "w") as f:
        f.write(html_content)

    # Save plain text
    text_path = out / f"market_report_{timestamp}.txt"
    text_content = console.export_text()
    with open(text_path, "w") as f:
        f.write(text_content)

    return {
        "json": str(json_path),
        "html": str(html_path),
        "text": str(text_path),
    }


# ---------------------------------------------------------------------------
#  Header
# ---------------------------------------------------------------------------

def _print_header():
    now = datetime.now().strftime("%A, %d %B %Y  %I:%M %p IST")
    header = Text()
    header.append("INDIAN MARKET INTELLIGENCE REPORT\n", style="bold white on blue")
    header.append(f"Generated: {now}\n", style="dim")
    header.append(
        "Sources: NSE, BSE, Moneycontrol, Economic Times, LiveMint, "
        "NDTV Profit, Business Standard, Trendlyne, Chittorgarh",
        style="dim italic",
    )
    console.print(Panel(header, title="[bold cyan]SP-GURU Finance Scraper[/]",
                        border_style="cyan", box=box.DOUBLE))
    console.print()


# ---------------------------------------------------------------------------
#  Market Sentiment
# ---------------------------------------------------------------------------

def _print_market_sentiment(sentiment: dict):
    if not sentiment:
        return

    mood = sentiment.get("sentiment", "Neutral")
    score = sentiment.get("score", 0)

    if "Bullish" in mood:
        color = "green"
        icon = "^"
    elif "Bearish" in mood:
        color = "red"
        icon = "v"
    else:
        color = "yellow"
        icon = "-"

    text = Text()
    text.append(f"  {icon} Overall Sentiment: ", style="bold")
    text.append(f"{mood}", style=f"bold {color}")
    text.append(f"  (Score: {score})\n")
    text.append(
        f"  Positive signals: {sentiment.get('positive_signals', 0)}  |  "
        f"Negative signals: {sentiment.get('negative_signals', 0)}  |  "
        f"Headlines analyzed: {sentiment.get('articles_analyzed', 0)}",
        style="dim",
    )
    console.print(Panel(text, title="[bold]MARKET SENTIMENT[/]",
                        border_style=color, box=box.ROUNDED))
    console.print()


# ---------------------------------------------------------------------------
#  Index Data
# ---------------------------------------------------------------------------

def _print_index_data(indices: list):
    if not indices:
        console.print(Panel("[dim]Index data unavailable[/]",
                            title="[bold]KEY INDICES[/]", border_style="yellow"))
        console.print()
        return

    table = Table(title="KEY INDIAN MARKET INDICES",
                  box=box.SIMPLE_HEAVY, show_lines=True,
                  title_style="bold white")
    table.add_column("Index", style="bold cyan", min_width=20)
    table.add_column("Last", justify="right", style="bold")
    table.add_column("Change", justify="right")
    table.add_column("% Change", justify="right")
    table.add_column("Open", justify="right", style="dim")
    table.add_column("High", justify="right", style="dim")
    table.add_column("Low", justify="right", style="dim")

    for idx in indices:
        pct = str(idx.get("pct_change", ""))
        try:
            pct_val = float(pct)
            color = "green" if pct_val >= 0 else "red"
        except (ValueError, TypeError):
            color = "white"

        table.add_row(
            str(idx.get("name", "")),
            str(idx.get("last", "")),
            Text(str(idx.get("change", "")), style=color),
            Text(f"{pct}%", style=f"bold {color}"),
            str(idx.get("open", "")),
            str(idx.get("high", "")),
            str(idx.get("low", "")),
        )

    console.print(table)
    console.print()


# ---------------------------------------------------------------------------
#  FII / DII
# ---------------------------------------------------------------------------

def _print_fii_dii(data: dict):
    if not data or (not data.get("fii") and not data.get("dii")):
        console.print(Panel("[dim]FII/DII data unavailable[/]",
                            title="[bold]FII / DII ACTIVITY[/]", border_style="yellow"))
        console.print()
        return

    table = Table(title=f"FII / DII ACTIVITY  ({data.get('date', 'Latest')})",
                  box=box.SIMPLE_HEAVY, show_lines=True,
                  title_style="bold white")
    table.add_column("Category", style="bold cyan", min_width=15)
    table.add_column("Buy Value (Cr)", justify="right")
    table.add_column("Sell Value (Cr)", justify="right")
    table.add_column("Net Value (Cr)", justify="right", style="bold")

    for label, key in [("FII / FPI", "fii"), ("DII", "dii")]:
        info = data.get(key, {})
        if info:
            net = str(info.get("net_value", ""))
            try:
                net_val = float(net.replace(",", ""))
                net_color = "green" if net_val >= 0 else "red"
                net_prefix = "+" if net_val > 0 else ""
            except (ValueError, TypeError):
                net_color = "white"
                net_prefix = ""

            table.add_row(
                label,
                str(info.get("buy_value", "")),
                str(info.get("sell_value", "")),
                Text(f"{net_prefix}{net}", style=f"bold {net_color}"),
            )

    console.print(table)

    # Quick summary line
    fii_net = data.get("fii", {}).get("net_value", "")
    dii_net = data.get("dii", {}).get("net_value", "")
    summary = Text("  Summary: ", style="bold")
    for label, val in [("FII Net", fii_net), ("DII Net", dii_net)]:
        try:
            v = float(str(val).replace(",", ""))
            action = "BOUGHT" if v > 0 else "SOLD"
            color = "green" if v > 0 else "red"
            summary.append(f"{label}: ", style="bold")
            summary.append(f"{action} Rs {abs(v):,.0f} Cr  ", style=f"bold {color}")
        except (ValueError, TypeError):
            pass
    if summary.plain.strip() != "Summary:":
        console.print(summary)
    console.print()


# ---------------------------------------------------------------------------
#  Top News
# ---------------------------------------------------------------------------

def _print_top_news(news: dict):
    if not news:
        console.print(Panel("[dim]News unavailable[/]",
                            title="[bold]TOP MARKET NEWS[/]", border_style="yellow"))
        console.print()
        return

    console.print(Panel("[bold white]TOP MARKET NEWS[/]",
                        border_style="blue", box=box.DOUBLE))

    # Deduplicate by title similarity
    seen_titles: set[str] = set()
    all_articles = []
    for source, articles in news.items():
        for art in articles:
            title_key = art["title"].lower()[:60]
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                all_articles.append(art)

    # Show top 20 unique headlines
    for i, art in enumerate(all_articles[:20], 1):
        source_tag = art.get("source", "")
        console.print(
            f"  [bold cyan]{i:2d}.[/] [bold]{art['title']}[/]"
        )
        meta = f"      [{source_tag}]"
        if art.get("published"):
            meta += f"  {art['published']}"
        console.print(f"  [dim]{meta}[/]")
        if art.get("summary"):
            console.print(f"      [dim italic]{art['summary'][:150]}...[/]")
        console.print()

    console.print()


# ---------------------------------------------------------------------------
#  Consensus Recommendations
# ---------------------------------------------------------------------------

def _print_consensus_recommendations(reco_data: dict):
    consensus = reco_data.get("consensus", [])
    if not consensus:
        console.print(Panel("[dim]No recommendation data available[/]",
                            title="[bold]STOCK RECOMMENDATIONS[/]", border_style="yellow"))
        console.print()
        return

    table = Table(
        title="TOP CONSENSUS STOCK RECOMMENDATIONS (Multi-Source)",
        box=box.SIMPLE_HEAVY, show_lines=True,
        title_style="bold white",
    )
    table.add_column("#", style="dim", width=3)
    table.add_column("Stock", style="bold cyan", min_width=20)
    table.add_column("Action", justify="center")
    table.add_column("Sources", justify="center", style="bold yellow")
    table.add_column("Mentions", justify="center")
    table.add_column("Target(s)", justify="right", style="dim")
    table.add_column("Source Names", style="dim italic", max_width=30)

    for i, item in enumerate(consensus[:15], 1):
        action = item.get("recommendation", "")
        action_color = "green" if action.lower() in ("buy", "accumulate", "outperform") else \
                       "red" if action.lower() in ("sell", "reduce", "underperform") else "yellow"
        targets = ", ".join(item.get("targets", [])[:3]) or "-"
        sources = ", ".join(item.get("sources", []))

        table.add_row(
            str(i),
            item.get("stock", ""),
            Text(action, style=f"bold {action_color}"),
            str(item.get("source_count", "")),
            str(item.get("total_mentions", "")),
            targets,
            sources,
        )

    console.print(table)
    console.print()


# ---------------------------------------------------------------------------
#  Short-Term / Intraday Picks
# ---------------------------------------------------------------------------

def _print_short_term_picks(reco_data: dict):
    picks = reco_data.get("short_term", [])
    if not picks:
        return

    table = Table(
        title="SHORT-TERM / INTRADAY PICKS",
        box=box.SIMPLE_HEAVY, show_lines=True,
        title_style="bold magenta",
    )
    table.add_column("#", style="dim", width=3)
    table.add_column("Stock", style="bold cyan", min_width=20)
    table.add_column("Action", justify="center")
    table.add_column("Score", justify="center", style="bold yellow")
    table.add_column("Sources", justify="center")
    table.add_column("Target(s)", justify="right", style="dim")

    for i, item in enumerate(picks[:10], 1):
        action = item.get("recommendation", "")
        action_color = "green" if action.lower() in ("buy", "accumulate") else "red"
        targets = ", ".join(item.get("targets", [])[:2]) or "-"
        table.add_row(
            str(i),
            item.get("stock", ""),
            Text(action, style=f"bold {action_color}"),
            str(item.get("short_term_score", "")),
            str(item.get("source_count", "")),
            targets,
        )

    console.print(table)
    note = (
        "  [dim italic]Note: Short-term picks are based on momentum signals, "
        "multi-source consensus, and intraday keywords in analyst headlines. "
        "Always set stop-losses for intraday trades.[/]"
    )
    console.print(note)
    console.print()


# ---------------------------------------------------------------------------
#  Long-Term Picks
# ---------------------------------------------------------------------------

def _print_long_term_picks(reco_data: dict):
    picks = reco_data.get("long_term", [])
    if not picks:
        return

    table = Table(
        title="LONG-TERM INVESTMENT PICKS",
        box=box.SIMPLE_HEAVY, show_lines=True,
        title_style="bold green",
    )
    table.add_column("#", style="dim", width=3)
    table.add_column("Stock", style="bold cyan", min_width=20)
    table.add_column("Action", justify="center")
    table.add_column("Score", justify="center", style="bold yellow")
    table.add_column("Sources", justify="center")
    table.add_column("Target(s)", justify="right", style="dim")

    for i, item in enumerate(picks[:10], 1):
        action = item.get("recommendation", "")
        action_color = "green" if action.lower() in ("buy", "accumulate") else "yellow"
        targets = ", ".join(item.get("targets", [])[:2]) or "-"
        table.add_row(
            str(i),
            item.get("stock", ""),
            Text(action, style=f"bold {action_color}"),
            str(item.get("long_term_score", "")),
            str(item.get("source_count", "")),
            targets,
        )

    console.print(table)
    note = (
        "  [dim italic]Note: Long-term picks are based on multi-source consensus, "
        "fundamental keywords, and analyst conviction. Always do your own research (DYOR).[/]"
    )
    console.print(note)
    console.print()


# ---------------------------------------------------------------------------
#  Upcoming Results
# ---------------------------------------------------------------------------

def _print_upcoming_results(results: list):
    if not results:
        console.print(Panel("[dim]No upcoming results data available[/]",
                            title="[bold]UPCOMING RESULTS[/]", border_style="yellow"))
        console.print()
        return

    table = Table(title="UPCOMING QUARTERLY RESULTS",
                  box=box.SIMPLE_HEAVY, show_lines=True,
                  title_style="bold white")
    table.add_column("#", style="dim", width=3)
    table.add_column("Company", style="bold cyan", min_width=25)
    table.add_column("Date", justify="center")
    table.add_column("Period", justify="center", style="dim")
    table.add_column("Source", style="dim italic")

    for i, r in enumerate(results[:15], 1):
        table.add_row(
            str(i),
            r.get("company", ""),
            r.get("date", ""),
            r.get("period", ""),
            r.get("source", ""),
        )

    console.print(table)
    console.print()


# ---------------------------------------------------------------------------
#  Upcoming Dividends
# ---------------------------------------------------------------------------

def _print_upcoming_dividends(dividends: list):
    if not dividends:
        console.print(Panel("[dim]No upcoming dividend data available[/]",
                            title="[bold]UPCOMING DIVIDENDS[/]", border_style="yellow"))
        console.print()
        return

    table = Table(title="UPCOMING DIVIDENDS",
                  box=box.SIMPLE_HEAVY, show_lines=True,
                  title_style="bold white")
    table.add_column("#", style="dim", width=3)
    table.add_column("Company", style="bold cyan", min_width=25)
    table.add_column("Ex-Date", justify="center")
    table.add_column("Dividend Amount", justify="right", style="bold green")
    table.add_column("Record Date", justify="center", style="dim")

    for i, d in enumerate(dividends[:15], 1):
        table.add_row(
            str(i),
            d.get("company", ""),
            d.get("ex_date", ""),
            d.get("dividend_amount", ""),
            d.get("record_date", ""),
        )

    console.print(table)
    console.print()


# ---------------------------------------------------------------------------
#  Bonus & Splits
# ---------------------------------------------------------------------------

def _print_bonus_and_splits(bonuses: list):
    if not bonuses:
        console.print(Panel("[dim]No upcoming bonus/split data available[/]",
                            title="[bold]BONUS & STOCK SPLITS[/]", border_style="yellow"))
        console.print()
        return

    table = Table(title="UPCOMING BONUS ISSUES & STOCK SPLITS",
                  box=box.SIMPLE_HEAVY, show_lines=True,
                  title_style="bold white")
    table.add_column("#", style="dim", width=3)
    table.add_column("Company", style="bold cyan", min_width=25)
    table.add_column("Type", justify="center", style="bold magenta")
    table.add_column("Ratio / Details", justify="center")
    table.add_column("Ex-Date", justify="center")
    table.add_column("Record Date", justify="center", style="dim")

    for i, b in enumerate(bonuses[:15], 1):
        table.add_row(
            str(i),
            b.get("company", ""),
            b.get("type", ""),
            b.get("ratio", ""),
            b.get("ex_date", ""),
            b.get("record_date", ""),
        )

    console.print(table)
    console.print()


# ---------------------------------------------------------------------------
#  IPO Section
# ---------------------------------------------------------------------------

def _print_ipo_section(ipo_data: dict):
    if not ipo_data:
        console.print(Panel("[dim]No IPO data available[/]",
                            title="[bold]IPO DASHBOARD[/]", border_style="yellow"))
        console.print()
        return

    console.print(Panel("[bold white]IPO DASHBOARD[/]",
                        border_style="magenta", box=box.DOUBLE))

    for section_key, section_title in [
        ("open", "CURRENTLY OPEN IPOs"),
        ("upcoming", "UPCOMING IPOs"),
        ("recently_listed", "RECENTLY LISTED IPOs"),
    ]:
        items = ipo_data.get(section_key, [])
        if not items:
            console.print(f"  [dim]{section_title}: None available[/]")
            console.print()
            continue

        table = Table(title=section_title, box=box.SIMPLE,
                      title_style="bold yellow")
        table.add_column("#", style="dim", width=3)
        table.add_column("IPO Name", style="bold cyan", min_width=25)
        table.add_column("Date", justify="center")
        table.add_column("Issue Size", justify="right")
        table.add_column("Price Band", justify="right", style="dim")

        for i, ipo in enumerate(items[:10], 1):
            table.add_row(
                str(i),
                ipo.get("name", ""),
                ipo.get("date", ""),
                ipo.get("size", ""),
                ipo.get("price_band", ""),
            )

        console.print(table)
        console.print()


# ---------------------------------------------------------------------------
#  Disclaimer
# ---------------------------------------------------------------------------

def _print_disclaimer():
    disclaimer = (
        "DISCLAIMER: This report is auto-generated by scraping publicly "
        "available financial websites. It is for INFORMATIONAL PURPOSES ONLY "
        "and does NOT constitute financial advice. Stock recommendations are "
        "aggregated from third-party analyst opinions and may not reflect "
        "current market conditions. Always consult a SEBI-registered financial "
        "advisor before making investment decisions. Past performance is not "
        "indicative of future results. The creator of this tool is not "
        "responsible for any financial losses. Trade at your own risk."
    )
    console.print(Panel(
        disclaimer,
        title="[bold red]DISCLAIMER[/]",
        border_style="red",
        box=box.DOUBLE,
    ))
    console.print()
