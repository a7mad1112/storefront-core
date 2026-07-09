#!/usr/bin/env python3
"""
Unified Multi-Supplier Scraper Runner (Phase 8f)

Orchestrates running multiple supplier product scrapers (`gbstore`, `balagan`, `sakher`)
either sequentially or concurrently (`--parallel`).

Usage:
    python -m scraper.run_all --supplier all
    python -m scraper.run_all --supplier gbstore balagan
    python -m scraper.run_all --supplier all --parallel
"""

import argparse
import concurrent.futures
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Project root directory (parent of scraper/)
ROOT_DIR = Path(__file__).resolve().parent.parent

SUPPLIER_MODULES = {
    "gbstore": {
        "name": "جي بي ستور (GB Store)",
        "module": "scraper.sync",
    },
    "balagan": {
        "name": "بلاغان (Balagan)",
        "module": "scraper.suppliers.balagan.sync",
    },
    "sakher": {
        "name": "صخر براندز (Sakher Brands)",
        "module": "scraper.suppliers.sakher.sync",
    },
}


def run_supplier_scraper(supplier_code: str, module_name: str, supplier_name: str, env_updates: dict = None):
    """
    Run a single supplier sync module in a clean subprocess.
    Returns (supplier_code, supplier_name, status, duration_seconds, exit_code, error_msg).
    """
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] ▶ Starting scraper for {supplier_name} (`{supplier_code}`)...")
    start_time = time.time()

    env = os.environ.copy()
    if env_updates:
        for k, v in env_updates.items():
            if v is not None:
                env[k] = str(v)

    cmd = [sys.executable, "-m", module_name]

    try:
        # Run module from workspace root directory so module resolution works reliably
        result = subprocess.run(cmd, cwd=str(ROOT_DIR), env=env)
        duration = time.time() - start_time
        status = "PASSED" if result.returncode == 0 else "FAILED"
        return (supplier_code, supplier_name, status, duration, result.returncode, None)
    except Exception as e:
        duration = time.time() - start_time
        return (supplier_code, supplier_name, "ERROR", duration, -1, str(e))


def print_summary_table(results, total_duration):
    """
    Print a formatted summary table of all scraper runs.
    """
    print("\n" + "=" * 78)
    print(" " * 22 + "MULTI-SUPPLIER SYNC SUMMARY REPORT")
    print("=" * 78)
    print(f"{'SUPPLIER CODE':<15} | {'SUPPLIER NAME':<30} | {'STATUS':<10} | {'DURATION':<12}")
    print("-" * 78)

    all_passed = True
    for code, name, status, duration, exit_code, err in results:
        if status != "PASSED":
            all_passed = False
            status_str = f"❌ {status}"
        else:
            status_str = f"✅ {status}"

        minutes = int(duration // 60)
        seconds = duration % 60
        if minutes > 0:
            dur_str = f"{minutes}m {seconds:.1f}s"
        else:
            dur_str = f"{seconds:.1f}s"

        # Trim long names for display
        display_name = (name[:27] + "...") if len(name) > 30 else name
        print(f"{code:<15} | {display_name:<30} | {status_str:<10} | {dur_str:<12}")
        if err:
            print(f"  └─ Error: {err}")

    print("-" * 78)
    total_min = int(total_duration // 60)
    total_sec = total_duration % 60
    total_str = f"{total_min}m {total_sec:.1f}s" if total_min > 0 else f"{total_sec:.1f}s"
    overall_status = "ALL SUCCEEDED ✅" if all_passed else "SOME FAILED ❌"
    print(f"Total Orchestration Time: {total_str:<25} Overall Status: {overall_status}")
    print("=" * 78 + "\n")

    return all_passed


def main():
    parser = argparse.ArgumentParser(
        description="Run multiple supplier scrapers in a single orchestrated execution."
    )
    parser.add_argument(
        "--supplier",
        "-s",
        nargs="+",
        default=["all"],
        help="Suppliers to run: 'gbstore', 'balagan', 'sakher', or 'all' (default: all)",
    )
    parser.add_argument(
        "--parallel",
        "-p",
        action="store_true",
        help="Run selected supplier scrapers concurrently instead of sequentially.",
    )
    parser.add_argument(
        "--details",
        action="store_true",
        default=None,
        help="Force scraping detailed product pages (`SCRAPE_PRODUCT_DETAILS=true`).",
    )
    parser.add_argument(
        "--no-details",
        action="store_true",
        default=None,
        help="Skip scraping detailed product pages (`SCRAPE_PRODUCT_DETAILS=false`).",
    )

    args = parser.parse_args()

    # Parse and normalize targets
    raw_targets = []
    for s in args.supplier:
        for token in s.split(","):
            token = token.strip().lower()
            if token:
                raw_targets.append(token)

    targets = []
    if "all" in raw_targets:
        targets = list(SUPPLIER_MODULES.keys())
    else:
        for t in raw_targets:
            if t in SUPPLIER_MODULES:
                if t not in targets:
                    targets.append(t)
            else:
                print(f"[WARNING] Unknown supplier `{t}` ignored. Valid suppliers: {list(SUPPLIER_MODULES.keys())}")

    if not targets:
        print("[ERROR] No valid suppliers selected to run.")
        sys.exit(1)

    # Determine details flag override
    env_updates = {}
    if args.details:
        env_updates["SCRAPE_PRODUCT_DETAILS"] = "true"
    elif args.no_details:
        env_updates["SCRAPE_PRODUCT_DETAILS"] = "false"

    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting Multi-Supplier Orchestrator")
    print(f"Targets: {targets} | Execution Mode: {'PARALLEL' if args.parallel else 'SEQUENTIAL'}")

    start_total = time.time()
    results = []

    if args.parallel and len(targets) > 1:
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(targets)) as executor:
            future_to_supplier = {
                executor.submit(
                    run_supplier_scraper,
                    code,
                    SUPPLIER_MODULES[code]["module"],
                    SUPPLIER_MODULES[code]["name"],
                    env_updates,
                ): code
                for code in targets
            }
            for future in concurrent.futures.as_completed(future_to_supplier):
                results.append(future.result())
        # Sort results by supplier order defined in SUPPLIER_MODULES
        order = {k: idx for idx, k in enumerate(SUPPLIER_MODULES.keys())}
        results.sort(key=lambda r: order.get(r[0], 99))
    else:
        for code in targets:
            info = SUPPLIER_MODULES[code]
            res = run_supplier_scraper(code, info["module"], info["name"], env_updates)
            results.append(res)

    total_duration = time.time() - start_total
    all_passed = print_summary_table(results, total_duration)

    if not all_passed:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
