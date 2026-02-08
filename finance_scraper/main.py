#!/usr/bin/env python3
"""
SP-GURU Indian Market Intelligence Report Generator
====================================================
Scrapes multiple finance websites to produce a consolidated report with:
  - Key market indices (Nifty, Sensex, Bank Nifty, sectoral)
  - FII / DII buy-sell activity
  - Top market news from 7+ sources
  - Consensus stock recommendations (multi-source)
  - Short-term / intraday picks
  - Long-term investment picks
  - Upcoming quarterly results
  - Upcoming dividends
  - Bonus issues & stock splits
  - IPO dashboard (open, upcoming, recently listed)

Usage:
    python -m finance_scraper.main              # full report (live scrape)
    python -m finance_scraper.main --demo       # demo with sample data
    python -m finance_scraper.main --save       # save to output/
    python -m finance_scraper.main --schedule   # run every 30 min
    python -m finance_scraper.main --json       # print raw JSON only
"""

import argparse
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Any

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from .analyzer import aggregate_recommendations, extract_market_sentiment
from .report import generate_report, save_report
from .scrapers import (
    fetch_fii_dii_data,
    fetch_index_data,
    fetch_ipo_data,
    fetch_news,
    fetch_recommendations,
    fetch_upcoming_bonus,
    fetch_upcoming_dividends,
    fetch_upcoming_results,
)

console = Console()


def _scrape_all() -> dict[str, Any]:
    """Run all scrapers concurrently and return combined data."""
    data: dict[str, Any] = {}

    tasks = {
        "indices": fetch_index_data,
        "fii_dii": fetch_fii_dii_data,
        "news": fetch_news,
        "raw_recommendations": fetch_recommendations,
        "results": fetch_upcoming_results,
        "dividends": fetch_upcoming_dividends,
        "bonus": fetch_upcoming_bonus,
        "ipos": fetch_ipo_data,
    }

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        overall = progress.add_task("[cyan]Scraping finance data...", total=len(tasks))

        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = {}
            for name, func in tasks.items():
                future = executor.submit(func)
                futures[future] = name

            for future in as_completed(futures):
                name = futures[future]
                try:
                    result = future.result()
                    data[name] = result
                    progress.advance(overall)
                    progress.update(overall,
                                    description=f"[cyan]Scraped {name.replace('_', ' ')}...")
                except Exception as e:
                    console.print(f"  [yellow]Warning: {name} scraper failed: {e}[/]")
                    data[name] = [] if name != "ipos" else {}
                    progress.advance(overall)

    return data


def _analyze(data: dict[str, Any]) -> dict[str, Any]:
    """Run analysis on scraped data."""
    # Aggregate recommendations
    raw_recos = data.pop("raw_recommendations", [])
    data["recommendations"] = aggregate_recommendations(raw_recos)

    # Sentiment analysis from news
    data["sentiment"] = extract_market_sentiment(data.get("news", {}))

    data["generated_at"] = datetime.now().isoformat()
    return data


def run_once(save: bool = False, json_only: bool = False,
             demo: bool = False) -> dict[str, Any]:
    """Run a single scrape-analyze-report cycle."""
    console.print()
    console.print("[bold cyan]Starting SP-GURU Indian Market Intelligence...[/]")
    console.print()

    # 1. Scrape (or load demo data)
    if demo:
        from .demo_data import get_demo_data
        data = get_demo_data()
        console.print("[yellow]Running in DEMO mode with sample data[/]")
        console.print()
    else:
        data = _scrape_all()

    # 2. Analyze
    data = _analyze(data)

    # 3. Output
    if json_only:
        print(json.dumps(data, indent=2, default=str))
    else:
        generate_report(data)

    # 4. Save
    if save:
        paths = save_report(data)
        console.print("[bold green]Report saved:[/]")
        for fmt, path in paths.items():
            console.print(f"  {fmt.upper()}: {path}")
        console.print()

    return data


def run_scheduled(interval_minutes: int = 30, save: bool = True):
    """Run the scraper on a schedule."""
    try:
        import schedule
    except ImportError:
        console.print("[red]Install 'schedule' package: pip install schedule[/]")
        sys.exit(1)

    console.print(f"[bold cyan]Scheduled mode: running every {interval_minutes} minutes[/]")
    console.print("[dim]Press Ctrl+C to stop[/]")

    def _job():
        try:
            run_once(save=save)
        except Exception as e:
            console.print(f"[red]Error in scheduled run: {e}[/]")

    # Run immediately, then on schedule
    _job()
    schedule.every(interval_minutes).minutes.do(_job)

    try:
        while True:
            schedule.run_pending()
            time.sleep(10)
    except KeyboardInterrupt:
        console.print("\n[yellow]Scheduled scraping stopped.[/]")


def main():
    parser = argparse.ArgumentParser(
        description="SP-GURU Indian Market Intelligence Report Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--save", action="store_true",
        help="Save report to output/ directory (JSON, HTML, TXT)",
    )
    parser.add_argument(
        "--demo", action="store_true",
        help="Run with sample demo data (no internet required)",
    )
    parser.add_argument(
        "--json", action="store_true", dest="json_only",
        help="Output raw JSON data only (no formatted report)",
    )
    parser.add_argument(
        "--schedule", action="store_true",
        help="Run scraper on a repeating schedule",
    )
    parser.add_argument(
        "--interval", type=int, default=30,
        help="Schedule interval in minutes (default: 30)",
    )

    args = parser.parse_args()

    if args.schedule:
        run_scheduled(interval_minutes=args.interval, save=args.save)
    else:
        run_once(save=args.save, json_only=args.json_only, demo=args.demo)


if __name__ == "__main__":
    main()
