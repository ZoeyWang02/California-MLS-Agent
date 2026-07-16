import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getSession, updateSession, clearSession } from "../src/session.js";

function tempSessionsPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "mls-session-test-"));
  return join(dir, "sessions.json");
}

test("getSession returns a fresh session when none exists", () => {
  const path = tempSessionsPath();
  const session = getSession("user-1", path);
  assert.deepEqual(session, { conversationStep: 0 });
});

test("updateSession merges fields across turns without losing earlier ones", () => {
  const path = tempSessionsPath();
  updateSession("user-1", { city: "Irvine", conversationStep: 1 }, path);
  const after = updateSession("user-1", { maxPrice: 1200000, conversationStep: 2 }, path);
  assert.equal(after.city, "Irvine");
  assert.equal(after.maxPrice, 1200000);
});

test("updateSession does not let undefined fields erase previously known values", () => {
  const path = tempSessionsPath();
  updateSession("user-1", { city: "Irvine", maxPrice: 1200000, conversationStep: 1 }, path);
  // Simulate a turn where the message didn't mention a city again.
  const after = updateSession("user-1", { city: undefined, beds: 3, conversationStep: 2 }, path);
  assert.equal(after.city, "Irvine");
  assert.equal(after.beds, 3);
});

test("sessions for different users do not collide", () => {
  const path = tempSessionsPath();
  updateSession("user-1", { city: "Irvine", conversationStep: 1 }, path);
  updateSession("user-2", { city: "Pasadena", conversationStep: 1 }, path);
  assert.equal(getSession("user-1", path).city, "Irvine");
  assert.equal(getSession("user-2", path).city, "Pasadena");
});

test("clearSession removes stored state", () => {
  const path = tempSessionsPath();
  updateSession("user-1", { city: "Irvine", conversationStep: 1 }, path);
  clearSession("user-1", path);
  assert.deepEqual(getSession("user-1", path), { conversationStep: 0 });
});
