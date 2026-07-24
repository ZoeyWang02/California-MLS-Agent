# California MLS Agent

Internship project for building an OpenClaw-based multi-agent real estate assistant over California MLS data.

## Documentation

- [Week 1 Architecture](docs/week1_architecture.md)
- [Workflow Diagram](docs/workflow_diagram.md)
- [Week 2 NLP Property Search](docs/week2_nlp_property_search.md)
- [Week 3 Database Integration](docs/week3_database_integration.md)
- [Week 4 Conversational Agent](docs/week4_conversational_agent.md)
- [Week 5 Market Statistics](docs/week5_market_stats.md)

## Week 1 Code

Week 1's deliverable is architecture documentation only (see `docs/`); no code is required for that week.

## Week 2-5 Code (TypeScript per OpenClaw, Python for Week 5 trend analysis)

- `src/nlp/parsePropertyQuery.ts`: Week 2 natural-language property filter parser
- `src/db.ts`: MySQL connection pool (`mysql2/promise`)
- `src/tools/searchActiveListings.ts`: Week 3 paginated active listing search
- `src/tools/getSoldComps.ts`: Week 3 sold comps lookup
- `src/tools/formatPropertyCard.ts`: Week 3 property card formatter
- `src/skills/propertySearchSkill.ts`: Week 3 skill tying the parser, search, and formatter together
- `src/session.ts`: Week 4 disk-persisted session store, keyed by userId
- `src/skills/conversationalPropertySearchSkill.ts`: Week 4 multi-turn search skill
- `src/tools/getMarketStats.ts`: Week 5 city market summary (SQL aggregation)
- `python/market_trend.py`: Week 5 monthly price trend analysis (pandas/SQLAlchemy, per handbook)
- `src/tools/getPriceTrend.ts`: Week 5 Node wrapper that runs `market_trend.py` and parses its output
- `src/mcpServer.ts`: MCP server exposing these skills as tools to OpenClaw
- `src/types.ts`: shared `PropertyFilters` / `ListingRow` / `SoldRow` / `UserSession` types

Install dependencies and run tests:

```powershell
npm install
npm test
```

The Week 5 price-trend tool additionally requires the Python venv from Week 0 (`pandas`, `sqlalchemy`, `mysql-connector-python` - see `requirements.txt`).

## Current Setup Notes

- MySQL schema: `idx_exchange`
- Expected MLS tables: `rets_property` for active listings and `california_sold` for sold comps
- OpenAI API key is still pending from the project owner
