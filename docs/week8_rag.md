# Week 8 Retrieval-Augmented Generation (RAG)

## Goal

Answer questions about real estate concepts, MLS field definitions, and market terminology by grounding responses in indexed source documents rather than the model's general knowledge - so answers reflect this project's actual schema and definitions, not guesses.

## Knowledge sources: mentor update (handbook v2)

The original handbook (v1) listed five illustrative knowledge-source categories, including "IDX Exchange internal documentation" and "California real estate law/disclosure summaries" that don't actually correspond to real, existing documents for this project. An initial version of this week's knowledge base filled that gap by writing a hand-authored glossary and a CA disclosure summary from scratch.

The project mentor (via handbook v2's added "Note on Sources" box, and a matching Slack message) clarified this was not required: those two categories were illustrative of what a *production* RAG pipeline might index, not a deliverable requirement. The actual required sources are:

1. **Real Estate Data Analyst Primer** - terminology and glossary (DOM, sale-to-list ratio, MLS status codes, etc.)
2. **Trestle Property MetaData** - the CoreLogic Trestle RESO Data Dictionary (field definitions)
3. **Week 5 market summaries** - already have this from `getCityMarketSummary()`
4. The handbook's own schema reference (pages 4-5) as a fourth source, specifically because `rets_property`'s core search fields (`L_SystemPrice`, `L_Keyword2`, `LM_Dec_3`, `LM_Int2_3`, `L_City`, `L_Address`, etc.) use IDX's own legacy naming and aren't in Trestle at all - `california_sold` maps almost entirely to Trestle's RESO names, so it's fully covered there, but `rets_property`'s legacy search fields need this handbook table instead.

The hand-authored glossary and CA disclosure doc were removed and replaced with content actually sourced from the two real PDFs the mentor pointed to.

## Knowledge base (`knowledge/*.md`)

- `real_estate_primer.md` - from the real "Real Estate Data Analyst Primer" PDF: MLS/CRMLS origin, transaction lifecycle, list vs. close price, commission structure, financing basics, listings vs. sold datasets, MLS status codes, DOM/CDOM, property types, analytics workflow
- `trestle_california_sold_fields.md` - `california_sold`'s ~31 columns, with Trestle's actual RESO Data Dictionary definitions (filtered from Trestle's several-hundred-field `Property` resource down to just the fields this project's table actually has)
- `trestle_rets_property_overlap_fields.md` - the `rets_property` fields (StandardStatus, YearBuilt, AssociationFee, ArchitecturalStyle, etc.) that do match Trestle/RESO names directly
- `rets_property_fields.md` - `rets_property`'s full column list, sourced from the handbook's own schema reference (pages 4-5) - this is what covers the legacy-named core search fields that aren't in Trestle
- `market_report_snapshot.md` - a real snapshot generated from Week 5's `market_stats` tool, with a short written interpretation

## Code

- [`python/rag.py`](../python/rag.py): `chunk_text`, `index_documents`, `retrieve`, `rag_answer` - the handbook's four pipeline functions. Reuses `get_client`/`get_embedding` from Week 6's `embeddings.py`.
  - `load_knowledge_documents()` and `build_index()` aren't in the handbook (it assumes docs/index already exist) - needed to actually load `knowledge/*.md` and turn it into a queryable index. `build_index()` caches the built index to `knowledge/.index_cache.json` so repeated questions don't re-embed the whole knowledge base every time (gitignored, rebuilds automatically if missing or if the knowledge files change - delete the cache file to force a rebuild).
- [`src/tools/ragAnswer.ts`](../src/tools/ragAnswer.ts) - spawns the venv's Python to run `rag.py` (same pattern as Weeks 5-7)
- [`src/mcpServer.ts`](../src/mcpServer.ts) - exposes it as the `rag_answer` MCP tool

## Bugs found while testing (this took three iterations to get right)

**1. `chunk_size=600` (handbook's default) split reference tables across chunks.** Asking "What columns are in california_sold?" only returned 3-4 columns, because `retrieve(top_k=4)` didn't pull in every chunk a table was split across.

**2. Raising chunk size to 2500 then caused cross-document conflation.** Once two similarly-formatted reference tables (`rets_property` and `california_sold` field lists) were each close to a single chunk, both scored similarly for a `california_sold` question, `retrieve()` pulled chunks from both, and the model silently merged both tables' columns into one answer - confidently wrong (e.g. attributing `rets_property`-only fields to `california_sold`) rather than visibly incomplete. Fixed by labeling each chunk with its source in the `rag_answer()` prompt and explicitly instructing the model not to merge fields from different sources.

**3. After rebuilding the knowledge base from the real Trestle PDF, the california_sold field table itself (~5,000 characters, ~31 rows) was still bigger than the 2500-character chunk size**, so it got split again and answers were truncated mid-table. Raised `chunk_size` to 6000 (and split the Trestle content into per-topic files - `trestle_california_sold_fields.md` vs. `trestle_rets_property_overlap_fields.md` - mirroring the fix from bug #2) so the whole table fits in one chunk. None of this is a fix to the chunking *algorithm* (still the handbook's `chunk_text`/`index_documents`/`retrieve`/`rag_answer`), just parameter tuning and document organization to fit this project's actual (real, not sample) reference content.

## Verified live, with real OpenAI calls (embeddings + gpt-4o-mini), at all three layers

The handbook's three example questions, tested via Python directly, after every knowledge-base rebuild:

- **"What does DOM mean?"** → correct definition from the real primer, sourced from `real_estate_primer.md`
- **"What columns are in california_sold?"** → complete, correctly-attributed list of all ~31 columns with real Trestle definitions, no `rets_property`-only fields mixed in
- **"What is a list-to-close ratio?"** → correctly identified as the primer's "sale-to-list ratio" (`ClosePrice ÷ ListPrice`), matching the formula used in `getMarketStats.ts`

## Tests

None - same reasoning as Weeks 6-7 (touches both the real database indirectly via the knowledge snapshot, and the real, billed OpenAI API), verified by running it rather than mocked.
