# Week 5 Market Statistics Agent

## Goal

Build a market analytics engine over `california_sold` (439K sold/closed transactions): average close price, price per sqft, list-to-close ratio, average days on market, and month-over-month price trends for any California city.

## Two languages, matching the handbook

This is the first week where the handbook's own example code is Python, not TypeScript - the city market summary is a plain SQL aggregation (fits the existing TS `query<T>` helper), but the price-trend analysis is a pandas/SQLAlchemy example. Rather than porting that to SQL, it's kept as Python (using the venv provisioned back in Week 0), and the TypeScript side shells out to it and parses its JSON output.

- [`src/tools/getMarketStats.ts`](../src/tools/getMarketStats.ts) — `getCityMarketSummary()`, the handbook's SQL aggregation query as-is, via `query<T>`
- [`python/market_trend.py`](../python/market_trend.py) — `get_price_trend(city, months)`, the handbook's pandas/SQLAlchemy example, runnable standalone (`python market_trend.py "San Diego" 12`) or as a subprocess
- [`src/tools/getPriceTrend.ts`](../src/tools/getPriceTrend.ts) — spawns the venv's `python.exe` to run `market_trend.py`, parses its JSON stdout
- [`src/mcpServer.ts`](../src/mcpServer.ts) — exposes both as the `market_stats` and `price_trend` MCP tools

## Bug found while testing: `pd.read_sql` params

The handbook's Python example passes `params=[city, months]` (a list) to `pd.read_sql`. Running it against the versions actually installed in this project's venv (pandas 3.0.3, SQLAlchemy 2.0.51) failed immediately:

```
sqlalchemy.exc.ArgumentError: List argument must consist only of tuples or dictionaries
```

Fixed by passing a tuple instead: `params=(city, months)`. Not a typo on our part - the handbook's snippet doesn't run as written against current library versions.

## Verified live

Both tools tested directly (`python/market_trend.py` run standalone against the real database), then through the TypeScript wrappers, then through the actual MCP protocol (spawning `dist/src/mcpServer.js` and calling the tools like OpenClaw would) before being wired in:

```
market_stats:
San Diego: 4158 sold, avg $1,152,573, median $925,000, $720/sqft, 30.3 avg DOM, 99.4% list-to-close
Los Angeles: 3709 sold, avg $1,599,377, median $1,125,000, $794/sqft, 46.9 avg DOM, 99.7% list-to-close
...

price_trend (San Diego, 6mo):
2026-01: 148 sold, avg $1,154,037, 42.3 avg DOM
2026-02: 655 sold, avg $1,142,885, 32.9 avg DOM (-1.0% MoM)
...
```

## Median price

The Week 5 deliverable text asks for "median price," but the handbook's own SQL only computes `AVG(ClosePrice)` - MySQL has no built-in `MEDIAN()`. Added it to `getCityMarketSummary()` using the standard window-function workaround: rank each city's sold rows by `ClosePrice` with `ROW_NUMBER() OVER (PARTITION BY City ORDER BY ClosePrice)`, then average the one (odd count) or two (even count) middle-ranked rows. Verified sensible against real data - `median_close_price` comes out lower than `avg_close_price` for every city (e.g. San Diego: avg $1,152,573 vs median $925,000), matching the expected right-skew of home prices (a few high-end sales pull the average up).

## Tests

No automated tests for these two files - consistent with every other database-touching function in this project (`searchActiveListings`, `getSoldComps`), which are verified by running them against the real local database rather than mocked.
