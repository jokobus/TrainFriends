#!/usr/bin/env python3
"""Simple helper to dump the sqlite DB used by the server.

Usage:
  python server/dump_db.py [--data PATH] [--json]

Default DB path is the `data.db` file next to this script (same as server/main.py uses).
"""
from __future__ import annotations
import argparse
import sqlite3
import json
import sys
import csv
import os
import time
from pathlib import Path


def get_default_db() -> Path:
    return Path(__file__).resolve().parent / "data.db"


def main() -> None:
    p = argparse.ArgumentParser(description="Dump all tables from TrainFriends sqlite DB")
    p.add_argument("--data", help="Path to sqlite data file (overrides default)")
    p.add_argument("--json", action="store_true", help="Output full DB as JSON")
    p.add_argument("--watch", action="store_true", help="Continuously watch the DB file and refresh output when it changes")
    p.add_argument("--interval", type=float, default=1.0, help="Polling interval in seconds when --watch is used (default: 1.0)")
    p.add_argument(
        "--csv",
        nargs="?",
        const="",
        help=(
            "Write each table as CSV into this directory. If flag is present without a path, "
            "CSV files are written next to the DB file."
        ),
    )
    p.add_argument("--drop", action="store_true", help="Delete the DB file(s). Requires --yes to perform deletion")
    p.add_argument("--yes", action="store_true", help="Confirm destructive actions like --drop")
    args = p.parse_args()

    db_path = Path(args.data) if args.data else get_default_db()
    if not db_path.exists():
        print(f"DB file not found: {db_path}", file=sys.stderr)
        sys.exit(2)

    # Handle drop (delete DB) before opening connection
    if args.drop:
        print(f"WARNING: --drop requested for DB: {db_path}")
        if not args.yes:
            print("Refusing to delete DB. Rerun with --yes to confirm.")
            sys.exit(3)
        # attempt to remove main db and possible -shm and -wal files
        to_remove = [db_path, db_path.with_suffix(db_path.suffix + "-shm"), db_path.with_suffix(db_path.suffix + "-wal")]
        removed = []
        for pth in to_remove:
            try:
                if pth.exists():
                    pth.unlink()
                    removed.append(str(pth))
            except Exception as e:
                print(f"Failed to remove {pth}: {e}")
        print("Removed files:\n" + "\n".join(removed) if removed else "No files removed")
        return

    def read_db(path: Path):
        """Return (tables, out) reading the sqlite DB at path."""
        if not path.exists():
            return [], {}
        conn = sqlite3.connect(str(path))
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        tables = [r[0] for r in cur.fetchall()]
        out = {}
        for t in tables:
            try:
                rows = conn.execute(f"SELECT * FROM {t}").fetchall()
                out[t] = [dict(r) for r in rows]
            except Exception as e:
                out[t] = {"error": str(e)}
        conn.close()
        return tables, out

    def render(tables, out, to_json: bool, csv_arg):
        # JSON
        if to_json:
            print(json.dumps(out, indent=2, default=str))
            return

        # CSV
        if csv_arg is not None:
            if csv_arg == "":
                csv_dir = db_path.parent
            else:
                csv_dir = Path(csv_arg)
            csv_dir.mkdir(parents=True, exist_ok=True)
            for t in tables:
                rows = out.get(t, [])
                csv_path = csv_dir / f"{t}.csv"
                try:
                    with csv_path.open("w", newline="", encoding="utf-8") as fh:
                        if not rows:
                            fh.write("")
                        else:
                            cols = list(rows[0].keys())
                            writer = csv.DictWriter(fh, fieldnames=cols)
                            writer.writeheader()
                            for r in rows:
                                writer.writerow({k: ("" if v is None else v) for k, v in r.items()})
                    print(f"Wrote CSV: {csv_path}")
                except Exception as e:
                    print(f"Failed to write CSV for table {t}: {e}")
            return

        # plain text
        for t in tables:
            rows = out.get(t)
            print("-" * 80)
            print(f"TABLE: {t} — {len(rows) if isinstance(rows, list) else 'error'} rows")
            if isinstance(rows, list):
                if not rows:
                    print("(empty)")
                else:
                    cols = list(rows[0].keys())
                    print(" | ".join(cols))
                    print("-" * 80)
                    for r in rows:
                        print(" | ".join(str(r.get(c, '')) for c in cols))
            else:
                print(rows)
            print()

    # initial non-watch run
    if not args.watch:
        tables, out = read_db(db_path)
        if not tables and not out:
            print(f"DB file not found or empty: {db_path}", file=sys.stderr)
            sys.exit(2)
        render(tables, out, args.json, args.csv)
        return

    # watch mode: poll the DB file mtime and refresh when changed
    interval = max(0.1, float(args.interval))
    last_mtime = None
    try:
        while True:
            if not db_path.exists():
                if last_mtime is not None:
                    # DB removed since last check
                    try:
                        os.system('cls' if os.name == 'nt' else 'clear')
                    except Exception:
                        print('\n' * 2)
                    print(f"DB file removed: {db_path}")
                    last_mtime = None
                # wait until appears again
                time.sleep(interval)
                continue

            mtime = db_path.stat().st_mtime
            if last_mtime is None or mtime != last_mtime:
                # changed -> re-read and print
                last_mtime = mtime
                tables, out = read_db(db_path)
                try:
                    os.system('cls' if os.name == 'nt' else 'clear')
                except Exception:
                    pass
                print(f"DB: {db_path} — refreshed: {time.strftime('%Y-%m-%d %H:%M:%S')}")
                if not tables and not out:
                    print("(no tables found)")
                else:
                    render(tables, out, args.json, args.csv)
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\nStopped watching. Exiting.")
        return


if __name__ == "__main__":
    main()
