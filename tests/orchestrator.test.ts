import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

// run before importing anything that touches db.ts/orchestrator.ts,
const envPath = ".env";
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

const { routeIntent } = await import("../src/skills/orchestrator.js");
const { clearSession } = await import("../src/session.js");


const TEST_USER = "test-user-orchestrator";

after(() => {
  clearSession(TEST_USER);
});

test("routeIntent('search', ...) returns active listings for a fully-specified query", async () => {
  const result = await routeIntent("search", "find homes in Irvine under 900k", TEST_USER);
  assert.equal(typeof result.response, "string");
  assert.ok(result.response.length > 0);
});

test("routeIntent('market', ...) returns a per-city price trend when a city is named", async () => {
  const result = await routeIntent("market", "how is the market in San Diego", "any-user");
  assert.match(result.response, /San Diego price trend/);
});

test("routeIntent('market', ...) falls back to a general summary with no city named", async () => {
  const result = await routeIntent("market", "give me a market overview", "any-user");
  assert.match(result.response, /Top markets by sold volume/);
});

test("routeIntent('mixed', ...) combines search and market results", async () => {
  const result = await routeIntent(
    "mixed",
    "Find me affordable homes in Pasadena and tell me whether prices are rising.",
    "test-user-orchestrator-mixed"
  );
  // Both halves present, joined by the combined-response separator.
  assert.ok(result.response.includes("---"));
  assert.match(result.response, /Pasadena/);
  clearSession("test-user-orchestrator-mixed");
});

test("routeIntent falls back to the default response for an unrecognized intent", async () => {
  const result = await routeIntent("banana", "whatever", "any-user");
  assert.match(result.response, /not sure how to help/);
});
