# Week 7 Recommendation Engine

## Goal

Given an active listing a user liked, recommend comparable active listings using a hybrid score - 60% structured similarity (price, beds, city, sqft), 40% embedding similarity of remarks - and validate each recommendation's price against recent `california_sold` comps.

## Code

- [`python/recommendations.py`](../python/recommendations.py):
  - `calculate_similarity_score(target, candidate, target_emb, candidate_emb)` - the handbook's hybrid scoring function, unchanged
  - `validate_with_comps(city, sqft, price)` - the handbook's comp validation function, ported from the handbook's generic `query(sql, params)` call to this project's SQLAlchemy engine (`%s` placeholders became named `:city`/`:low`/`:high`); added a zero-comps guard so `delta_pct` is `None` instead of dividing by zero when no comps exist for a size range
  - `fetch_listing_by_id(listing_id)` / `recommend_similar_listings(target_listing_id, top_k=5, candidate_limit=20)` - not in the handbook (it starts from an already-loaded `target`/`candidate` dict pair); needed to actually go from "a listing ID the user liked" to a scored, comp-validated top-5, as the deliverable requires
  - Reuses `build_listing_embedding`, `fetch_candidate_listings`, `get_engine`, `load_dotenv` from [`python/embeddings.py`](../python/embeddings.py) (Week 6) rather than duplicating them
- [`src/tools/recommendListings.ts`](../src/tools/recommendListings.ts) - spawns the venv's Python to run `recommendations.py` (same pattern as Weeks 5-6)
- [`src/mcpServer.ts`](../src/mcpServer.ts) - exposes it as the `recommend_similar_listings` MCP tool

## Cost note

`recommend_similar_listings` embeds the target listing plus every candidate (default pool: 20, same city as the target) - up to 21 real OpenAI calls per recommendation request, more than Week 6's single-query search. Still cheap (well under a cent per call at `text-embedding-3-small` pricing) but real, so `candidate_limit` defaults lower than Week 6's 50 to keep repeated use inexpensive.

## Verified live, with real OpenAI calls

Target: an Irvine listing at $1,790,000, 2,064 sqft. All three layers tested:

```
Python directly:
  SingleFamilyResidence in Irvine — $1,798,888 (score: 87.64)
    Comp check: $1,661,763 from 302 comps (+8.3% vs comps)
  SingleFamilyResidence in Irvine — $1,900,000 (score: 80.59)
    Comp check: $1,618,315 from 286 comps (+17.4% vs comps)
  Condominium in Irvine — $1,099,888 (score: 71.71)
    Comp check: $1,131,208 from 208 comps (-2.8% vs comps)

TypeScript wrapper: same scores and delta_pct, confirming JSON round-trips correctly

Real MCP protocol (spawning dist/src/mcpServer.js, calling recommend_similar_listings
like OpenClaw would): identical results
```

The top recommendation (score 87.64) is the closest in price ($1.79M vs $1.8M) and sqft (2,064 vs 2,108) to the target, in the same city - the structured half of the score is doing sensible work, and the comp validation numbers (dollar amounts in the hundreds of thousands to low millions, comp counts in the hundreds) are plausible for Irvine.

## Tests

None - same reasoning as Week 6: this touches both the real database and the real (billed) OpenAI API, so it's verified by running it rather than mocked.
