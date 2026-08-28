import { test } from "node:test";
import assert from "node:assert/strict";
import { onWhatsAppMessage } from "../src/skills/whatsappHandler.js";
import type { AgentResult } from "../src/skills/orchestrator.js";

test("onWhatsAppMessage returns the agent's response on success", async () => {
  const fakeOrchestrate = async (): Promise<AgentResult> => ({ response: "5 listings found." });
  const reply = await onWhatsAppMessage("find homes in Irvine", "test-user", fakeOrchestrate);
  assert.equal(reply, "5 listings found.");
});

test("onWhatsAppMessage falls back to a friendly message when orchestrate throws", async () => {
  const failingOrchestrate = async (): Promise<AgentResult> => {
    throw new Error("boom");
  };
  const reply = await onWhatsAppMessage("find homes in Irvine", "test-user", failingOrchestrate);
  assert.equal(reply, "Sorry, I hit an issue. Please try again.");
});
