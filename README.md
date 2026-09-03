# California MLS Agent

Internship project for building an OpenClaw-based multi-agent real estate assistant over California MLS data.

## Documentation

- [Week 1 Architecture](docs/week1_architecture.md)
- [Workflow Diagram](docs/workflow_diagram.md)
- [Week 2 NLP Property Search](docs/week2_nlp_property_search.md)
- [Week 3 Database Integration](docs/week3_database_integration.md)
- [Week 4 Conversational Agent](docs/week4_conversational_agent.md)
- [Week 5 Market Statistics](docs/week5_market_stats.md)
- [Week 6 Embeddings & Vector Search](docs/week6_embeddings.md)
- [Week 7 Recommendation Engine](docs/week7_recommendation_engine.md)
- [Week 8 RAG](docs/week8_rag.md)
- [Week 9 Multi-Agent Orchestration](docs/week9_orchestration.md)
- [Week 10 WhatsApp Communication Layer](docs/week10_whatsapp_layer.md)
- [Week 11 Email Agents & Safety Guardrails](docs/week11_email_agents.md)
- [Week 12 Capstone](docs/week12_capstone.md)

## Week 1 Code

Week 1's deliverable is architecture documentation only (see `docs/`); no code is required for that week.

## Week 2-11 Code (TypeScript per OpenClaw, Python for Week 5-8 pandas/OpenAI work)

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
- `python/embeddings.py`: Week 6 OpenAI embeddings + cosine similarity semantic search (per handbook), verified live
- `src/tools/semanticPropertySearch.ts`: Week 6 Node wrapper that runs `embeddings.py` and parses its output
- `python/recommendations.py`: Week 7 hybrid recommendation scoring + comp validation (per handbook), verified live
- `src/tools/recommendListings.ts`: Week 7 Node wrapper that runs `recommendations.py` and parses its output
- `knowledge/*.md`: Week 8 RAG knowledge base - Real Estate Data Analyst Primer, Trestle RESO field definitions (california_sold + rets_property overlap), handbook schema reference (rets_property legacy fields), Week 5 market snapshot
- `python/rag.py`: Week 8 chunk/index/retrieve/generate RAG pipeline (per handbook), verified live
- `src/tools/ragAnswer.ts`: Week 8 Node wrapper that runs `rag.py` and parses its output
- `src/skills/orchestrator.ts`: Week 9 intent classification + routing across all specialized agents
- `src/skills/whatsappHandler.ts`: Week 10 `onWhatsAppMessage` handler
- `src/tools/email.ts`: Week 11 draft-then-approve email agent (nodemailer)
- `src/mcpServer.ts`: MCP server exposing these skills as tools to OpenClaw
- `src/types.ts`: shared `PropertyFilters` / `ListingRow` / `SoldRow` / `UserSession` types

Install dependencies and run tests:

```powershell
npm install
npm test
```

The Week 5-8 Python tools additionally require the venv from Week 0 (`pandas`, `sqlalchemy`, `mysql-connector-python`, `openai`, `scikit-learn`, `numpy` - see `requirements.txt`).

## Current Setup Notes

- MySQL schema: `idx_exchange`
- Expected MLS tables: `rets_property` for active listings and `california_sold` for sold comps
- OpenAI API key is configured in `.env` (used starting Week 6)
- `EMAIL_USER`/`EMAIL_PASSWORD` (Gmail + app password) are configured in `.env` for Week 11's email agent - `sendApprovedEmail` sends a real email through this account, so it's only ever called after explicit approval
