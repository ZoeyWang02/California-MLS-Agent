# Week 10 WhatsApp Communication Layer

## Goal

Wire the complete orchestrator to WhatsApp as the primary interface, with clean formatted responses.

## An architecture note carried over from Week 9

The handbook's `onWhatsAppMessage(message, userId)` assumes you own the WhatsApp channel integration directly - it's the raw webhook handler. This project has used a different, already-verified architecture since Week 3 instead: functionality is exposed as MCP tools, and OpenClaw's own agent (which already owns the real WhatsApp channel) decides when to call them. That choice hasn't changed this week - `onWhatsAppMessage`/`formatForWhatsApp` are implemented as faithful, directly-testable code, but "wiring" them to intercept the raw WhatsApp channel would mean bypassing OpenClaw's own message handling entirely, which is a materially bigger platform change than this project has taken on. The functional deliverable - clean, WhatsApp-formatted responses reachable end-to-end over real WhatsApp - is already satisfied through `orchestrate_query`.

## Code

- [`src/skills/whatsappHandler.ts`](../src/skills/whatsappHandler.ts) - `onWhatsAppMessage(message, userId, orchestrateFn?)`, matching the handbook's try/catch-and-fall-back-to-a-friendly-message shape. No typing indicator (that's a channel-level feature of OpenClaw's own integration, not something this code controls). `orchestrateFn` defaults to the real `orchestrate()` but is injectable so the error-handling branch is tested without a real, billed `classifyIntent()` call.
- [`src/tools/formatPropertyCard.ts`](../src/tools/formatPropertyCard.ts) - `formatPropertyCardForWhatsApp()`, the handbook's emoji card template (🏠💰🛏📐📅), added alongside Week 3/4's plain-text `formatPropertyCard()` rather than replacing it
- [`src/skills/conversationalPropertySearchSkill.ts`](../src/skills/conversationalPropertySearchSkill.ts) - takes an optional `cardFormatter` parameter (default: the Week 3 plain formatter) so the orchestrator's `propertySearchAgent` can swap in the WhatsApp emoji style without touching this skill's own already-tested default behavior

## Tests

[`tests/whatsappHandler.test.ts`](../tests/whatsappHandler.test.ts) covers both the success path and the error fallback, using an injected fake `orchestrate` function - free, no real classification call. [`tests/formatPropertyCard.test.ts`](../tests/formatPropertyCard.test.ts) covers the new emoji card format. `tests/orchestrator.test.ts`'s search test was strengthened to assert the response actually contains the 🏠 emoji, catching a regression if the formatter wiring ever breaks.

All 29 tests pass (`npm test`).
