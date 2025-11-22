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
from pathlib import Path


def get_default_db() -> Path:
    return Path(__file__).resolve().parent / "data.db"


def main() -> None:
    p = argparse.ArgumentParser(description="Dump all tables from TrainFriends sqlite DB")
    p.add_argument("--data", help="Path to sqlite data file (overrides default)")
    p.add_argument("--json", action="store_true", help="Output full DB as JSON")
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

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # list user tables (ignore sqlite internal tables)
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

    if args.json:
        print(json.dumps(out, indent=2, default=str))
        return

    # If CSV requested, write CSVs into the chosen directory
    if args.csv is not None:
        # args.csv is '' when flag provided without a path -> use DB parent dir
        if args.csv == "":
            csv_dir = db_path.parent
        else:
            csv_dir = Path(args.csv)
        csv_dir.mkdir(parents=True, exist_ok=True)
        for t in tables:
            rows = out.get(t, [])
            csv_path = csv_dir / f"{t}.csv"
            try:
                with csv_path.open("w", newline="", encoding="utf-8") as fh:
                    if not rows:
                        # no rows -> write nothing (empty file)
                        fh.write("")
                    else:
                        cols = list(rows[0].keys())
                        writer = csv.DictWriter(fh, fieldnames=cols)
                        writer.writeheader()
                        for r in rows:
                            # ensure serializable strings
                            writer.writerow({k: ("" if v is None else v) for k, v in r.items()})
                print(f"Wrote CSV: {csv_path}")
            except Exception as e:
                print(f"Failed to write CSV for table {t}: {e}")
        return

    # plain text human-readable output
    for t in tables:
        rows = out.get(t)
        print("-" * 80)
        print(f"TABLE: {t} — {len(rows) if isinstance(rows, list) else 'error'} rows")
        if isinstance(rows, list):
            if not rows:
                print("(empty)")
            else:
                # header (columns)
                cols = list(rows[0].keys())
                print(" | ".join(cols))
                print("-" * 80)
                for r in rows:
                    print(" | ".join(str(r.get(c, '')) for c in cols))
        else:
            print(rows)
        print()


if __name__ == "__main__":
    main()
