# Week 6 Embeddings & Vector Search

## Goal

Go beyond keyword filtering: embed a free-text description and each candidate listing's remarks with OpenAI embeddings, rank by cosine similarity, and return the top 5 semantically closest active listings - so "charming craftsman with mountain views and character" can match a listing that never uses those exact words.

## Status: verified live, with real OpenAI calls

`get_embedding()` makes real, billed calls to the OpenAI embeddings API, so this wasn't run until getting an explicit go-ahead this session (cost was a fraction of a cent - `text-embedding-3-small` is $0.02 per 1M tokens). Verified at every layer, same as every other week:

- Python directly: `python python/embeddings.py "charming home with mountain views and character" "Irvine" 10` returned 5 real active Irvine listings, ranked by cosine similarity against their actual remarks
- TypeScript wrapper (`semanticPropertySearch()`): a "cozy starter condo close to transit" query correctly ranked condos above a multi-million-dollar single-family estate
- Through the real MCP protocol (spawning `dist/src/mcpServer.js` and calling `semantic_property_search` like OpenClaw would): a "luxury estate with resort-style backyard" query returned a $9,998,800 "extraordinary estate" as the top match

No bugs found this time (unlike nearly every other week) - the handbook's three functions worked as written once wired up to a real candidate pool.

## Code

- [`python/embeddings.py`](../python/embeddings.py):
  - `get_embedding(text, model="text-embedding-3-small")`, `build_listing_embedding(row)`, `find_similar_listings(query, listing_embeddings, top_k=5)` - the handbook's three functions, unchanged in logic
  - `fetch_candidate_listings(city=None, limit=50)` - not in the handbook (it assumes a pre-built `listing_embeddings` list exists); pulls a bounded pool of active listings with non-empty remarks from `rets_property` to embed against. Bounded rather than embedding the whole active table, since every row is a real API call.
  - `semantic_property_search(query, city=None, candidate_limit=50, top_k=5)` - the actual Week 6 deliverable, wiring the above together
  - CLI entry point printing JSON, for the Node side to shell out to (same pattern as Week 5's `market_trend.py`)
- [`src/tools/semanticPropertySearch.ts`](../src/tools/semanticPropertySearch.ts) - spawns the venv's Python to run `embeddings.py`
- [`src/mcpServer.ts`](../src/mcpServer.ts) - exposes it as the `semantic_property_search` MCP tool

## A scoping choice not specified by the handbook

The handbook's "why this matters" section implies embedding the full active listing set ahead of time so any query can be compared against it. Doing that here (53K+ local rows) would mean tens of thousands of real, billed embedding calls just to stand the feature up. Instead, each call embeds a bounded, on-the-fly candidate pool (default 50, optionally narrowed by city) rather than pre-computing and storing embeddings for the whole table. A cached/pre-computed embedding index over the full active set is closer to what Week 8's RAG indexing pattern does - worth revisiting there rather than duplicating that infrastructure now.

## Tests

None - same reasoning as every other OpenAI/DB-touching function in this project, plus the added constraint that testing this one costs real money. No automated test mocks the OpenAI call either, since that would just be testing a mock, not this code.
