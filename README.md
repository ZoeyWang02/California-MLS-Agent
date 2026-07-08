# California MLS Agent

Internship project for building an OpenClaw-based multi-agent real estate assistant over California MLS data.

## Documentation

- [Week 1 Architecture](docs/week1_architecture.md)
- [Workflow Diagram](docs/workflow_diagram.md)
- [Week 2 NLP Property Search](docs/week2_nlp_property_search.md)

## Week 1 Code

Week 1's deliverable is architecture documentation only (see `docs/`); no code is required for that week.

## Week 2 & 3 Code (TypeScript, per OpenClaw)

- `src/nlp/parsePropertyQuery.ts`: Week 2 natural-language property filter parser
- `src/db.ts`: MySQL connection pool (`mysql2/promise`)
- `src/tools/searchActiveListings.ts`: Week 3 paginated active listing search
- `src/tools/getSoldComps.ts`: Week 3 sold comps lookup
- `src/types.ts`: shared `PropertyFilters` / `ListingRow` / `SoldRow` types

Install dependencies and run tests:

```powershell
npm install
npm test
```

## Current Setup Notes

- MySQL schema: `idx_exchange`
- Expected MLS tables: `rets_property` for active listings and `california_sold` for sold comps
- OpenAI API key is still pending from the project owner
