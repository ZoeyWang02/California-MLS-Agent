"""Week 5 market trend analysis (matches the handbook's pandas/SQLAlchemy example).

Usage: python market_trend.py <city> [months]
Prints a JSON array of monthly trend rows to stdout.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.engine import URL


def load_dotenv(path: str = ".env") -> None:
    env_path = Path(path)
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_dotenv()

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        url = URL.create(
            "mysql+mysqlconnector",
            username=os.environ["MYSQL_USER"],
            password=os.environ.get("MYSQL_PASSWORD", ""),
            host=os.environ.get("MYSQL_HOST", "localhost"),
            database=os.environ.get("MYSQL_DATABASE", "idx_exchange"),
        )
        _engine = create_engine(url)
    return _engine


def get_price_trend(city: str, months: int = 24) -> pd.DataFrame:
    query = """
        SELECT
            DATE_FORMAT(CloseDate, "%Y-%m") AS month,
            COUNT(*)                        AS sales,
            ROUND(AVG(ClosePrice), 0)       AS avg_price,
            ROUND(AVG(DaysOnMarket), 1)     AS avg_dom
        FROM california_sold
        WHERE City = %s
          AND PropertyType = "Residential"
          AND CloseDate >= DATE_SUB(CURDATE(), INTERVAL %s MONTH)
        GROUP BY DATE_FORMAT(CloseDate, "%Y-%m")
        ORDER BY month
    """
    df = pd.read_sql(query, get_engine(), params=(city, months))
    df["price_change_pct"] = df["avg_price"].pct_change() * 100
    return df


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: market_trend.py <city> [months]", file=sys.stderr)
        return 1
    city = sys.argv[1]
    months = int(sys.argv[2]) if len(sys.argv) > 2 else 24
    df = get_price_trend(city, months)
    print(df.to_json(orient="records"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
