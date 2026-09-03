# Week 11 Email Agents & Safety Guardrails

## Goal

Automated email workflows (listing alerts, market reports, property summaries) with a strict draft-then-approve gate - no email is ever sent without explicit human confirmation.

## Code

- [`src/tools/email.ts`](../src/tools/email.ts):
  - `draftEmail(to, subject, body)` - the handbook's step 1, returns `{ draft, status: "pending_approval" }`, never touches the transporter
  - `sendApprovedEmail(draft, transporter?)` - the handbook's step 2, only called explicitly with an already-shown draft. Takes an optional injected `transporter` so it's testable without a real SMTP connection.
  - `buildWeeklyMarketReportBody()` - not in the handbook; builds the HTML report body from `getCityMarketSummary()` (Week 5), since the handbook's "weekly market report template populated from california_sold data" deliverable needs a real content source.
- [`src/mcpServer.ts`](../src/mcpServer.ts) - `draft_email`, `draft_weekly_market_report`, `send_approved_email` MCP tools. `send_approved_email`'s tool description explicitly requires a separate, later confirmation message from the user before it's called - never inferred, never in the same turn as the draft.

## A deliberate limit on this session's own testing

Every other week's code was verified with a real, live call (embeddings, chat completions, MySQL). This one is different: `sendApprovedEmail` sends a real email through the user's real Gmail account. That crosses into "send a message on the user's behalf," which requires the user's own explicit, per-action confirmation - not something to trigger while building and testing the code.

So `sendApprovedEmail` was verified with an injected fake transporter (`tests/email.test.ts`) confirming it's called with the exact right `to`/`subject`/`html`, and that `draftEmail` never touches a transporter at all - real logic, zero real sends. Sending a real test email is only done if the user asks for it directly, after seeing the exact draft content and recipient.

## Safety guardrail test suite

[`tests/email.test.ts`](../tests/email.test.ts) covers the handbook's safety rules directly:

- `draftEmail` returns `pending_approval` and never calls `sendMail` (even indirectly)
- `sendApprovedEmail` sends exactly the fields it was given, only when explicitly called with a draft
- `getSoldComps` never returns more than the 50-row cap ("return result sets of ≤50 rows per query")
- `buildWeeklyMarketReportBody` produces a real HTML report from `california_sold` data (not sample data)

## Tests

Unlike Weeks 6-8/9's paid-API code, this one *is* in the automated `npm test` suite - draftEmail/sendApprovedEmail don't cost anything to test once the transporter is injected, so there's no reason to leave the safety guardrails unverified by default.
