# Week 4 Conversational Property Search Agent

## Goal

Turn the single-turn Week 3 skill into a multi-turn conversation: ask follow-up questions for whatever is still missing (city, then budget), remember what's already been said, and refine/re-run the search as more criteria come in across messages.

## `UserSession` vs OpenClaw's own memory

These solve different problems:

- **OpenClaw's native session** — general conversational memory; keeps the raw back-and-forth so the LLM has context for what was said.
- **`UserSession`** ([`src/types.ts`](../src/types.ts)) — structured, deterministic application state: explicit typed slots (`city`, `maxPrice`, `beds`, ...) the code checks directly (`if (!session.maxPrice) ...`) instead of asking the LLM to re-infer state from raw history every turn. Deterministic, fast, and scoped to this one task.

## A measured deviation from the handbook

The handbook's `Map<string, UserSession>` example assumes the process handling messages stays alive between turns (that's really Week 10's architecture — your own long-running `onWhatsAppMessage` server). We measured our actual setup instead of assuming it matched: this code runs as an MCP server that OpenClaw spawns, and two separate `openclaw agent` turns came back with **different process PIDs** — the process does not persist between messages. A plain in-memory `Map` would silently lose all session state between turns.

[`src/session.ts`](../src/session.ts) persists sessions to `data/sessions.json` (gitignored) instead, keyed by `userId`, so state survives regardless of process lifetime. `updateSession` merges only defined fields from each turn's parsed filters, so a turn that doesn't mention a city (e.g. "under 1.2 million") doesn't erase a city captured earlier.

## Code

- [`src/session.ts`](../src/session.ts) — `getSession` / `updateSession` / `clearSession`, disk-persisted
- [`src/skills/conversationalPropertySearchSkill.ts`](../src/skills/conversationalPropertySearchSkill.ts) — parses the current message, merges it into the user's session, asks for city then budget if missing, otherwise (re-)runs `searchActiveListings` with the accumulated filters
- [`src/mcpServer.ts`](../src/mcpServer.ts) — exposes this as the `conversational_property_search` MCP tool

## Known limitation: `userId`

OpenClaw's agent does not automatically expose the sender's phone number to itself as a value it can pass into a tool call — it has to be told explicitly (in the tool description, or in-message) to use the sender's number as `userId`, consistently, on every turn. This isn't a real problem in Week 10's architecture, where the channel handler receives `userId` directly as a function argument rather than relying on an LLM to notice and forward it. Something to revisit when the WhatsApp channel layer is built out.

## Verified live (WhatsApp, two separate `openclaw agent` turns)

```
Turn 1 — "find homes in Irvine"
  -> "What is your budget?"
  -> data/sessions.json: { conversationStep: 1, city: "Irvine" }

Turn 2 — "under 1.2 million"
  -> 5 formatted Irvine listings under $1.2M
  -> data/sessions.json: { conversationStep: 2, city: "Irvine", maxPrice: 1200000, lastResults: [...] }
```

City from turn 1 was correctly remembered and combined with turn 2's budget — confirming session state survives across separately-spawned MCP server processes.

## Bug found while testing this: word-form price suffixes

Testing turn 2 with "under 1.2 million" first parsed `maxPrice` as `1.2` instead of `1,200,000` — the price regex only recognized a single-letter `k`/`m` suffix glued to the number (e.g. "1.2m"), not a space-separated word ("1.2 million"). Fixed in [`src/nlp/parsePropertyQuery.ts`](../src/nlp/parsePropertyQuery.ts) by adding `thousand`/`million` to the suffix alternation (ordered before `k`/`m` so the longer word wins). Covered by two new tests in [`tests/parsePropertyQuery.test.ts`](../tests/parsePropertyQuery.test.ts).

## Tests

[`tests/session.test.ts`](../tests/session.test.ts) covers fresh sessions, cross-turn merging, undefined-field protection, per-user isolation, and clearing — using a temp file path so it never touches real `data/sessions.json`.

```powershell
npm install
npm test
```
