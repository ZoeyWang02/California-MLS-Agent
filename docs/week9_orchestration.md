# Week 9 Multi-Agent Orchestration

## Goal

Combine every specialized agent built so far into a single coordinator: classify each incoming query's intent and route it (or split it across agents in parallel) to produce one unified response.

## Code

- [`src/skills/orchestrator.ts`](../src/skills/orchestrator.ts):
  - `classifyIntent(query)` - an LLM call (gpt-4o-mini) classifying into `search | market | recommend | knowledge | mixed`. Not specified by the handbook (it just calls `classifyIntent()`); implemented as a real, billed OpenAI call.
  - `routeIntent(intent, query, userId)` - the handbook's `orchestrate()` switch-case, pulled into its own function so it's testable with a hand-picked intent instead of needing a real classification call on every test run.
  - `propertySearchAgent`, `marketStatsAgent`, `recommendationAgent`, `ragAgent`, `formatCombinedResponse` - wrappers over Weeks 3/4 (search), 5 (market), 7 (recommendations), 8 (RAG)
  - `orchestrate(query, userId)` - `classifyIntent` then `routeIntent`, matching the handbook exactly
- [`src/mcpServer.ts`](../src/mcpServer.ts) - exposes it as the `orchestrate_query` MCP tool

## A real bug found via the handbook's own example query

The handbook's Week 9 example - `"Find me affordable homes in Pasadena and tell me whether prices are rising."` - broke Week 2's city-extraction regex. The regex only stopped at `under`/`with`/`at`/`below` or end-of-string, but this sentence ends in a period the character class couldn't consume, and has an `and`-joined second clause - so no valid match existed and `city` silently came back `undefined`. Fixed in `parsePropertyQuery.ts` by adding punctuation and `and` as additional stop conditions, with a regression test using this exact sentence.

## Verified live via WhatsApp, confirmed through trajectory logs (not just reading the chat)

Sent the handbook's exact example query via `orchestrate_query`. Rather than trusting the paraphrased WhatsApp reply, checked `~/.openclaw/agents/main/sessions/*.trajectory.jsonl` directly for the `tool.call`/`tool.result` entries - which showed the real arguments (`userId`, the exact query) and the real tool output: 5 real Pasadena listings plus a real 12-month price trend (avg price rising from ~$1.20M to ~$1.86M), joined with the `---` separator from `formatCombinedResponse`. Confirms `classifyIntent` correctly picked `mixed` and both halves ran in parallel as designed.

## Tests

[`tests/orchestrator.test.ts`](../tests/orchestrator.test.ts) covers `routeIntent` for `search`/`market`/`mixed`/an unrecognized intent automatically (DB-only, free). `recommend`/`knowledge` and `classifyIntent` itself touch billed OpenAI APIs and are verified live instead, same as Weeks 6-8.
