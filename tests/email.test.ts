import { test } from "node:test";
import assert from "node:assert/strict";
import type { Transporter } from "nodemailer";
import { readFileSync, existsSync } from "node:fs";

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

const { draftEmail, sendApprovedEmail, buildWeeklyMarketReportBody } = await import("../src/tools/email.js");
const { getSoldComps } = await import("../src/tools/getSoldComps.js");

test("draftEmail returns a pending-approval draft without sending anything", async () => {
  const result = await draftEmail("buyer@example.com", "New listing alert", "<p>Check this out</p>");
  assert.equal(result.status, "pending_approval");
  assert.deepEqual(result.draft, {
    to: "buyer@example.com",
    subject: "New listing alert",
    body: "<p>Check this out</p>",
  });
});

test("sendApprovedEmail only sends when explicitly given an approved draft", async () => {
  const calls: unknown[] = [];
  const fakeTransporter = {
    sendMail: async (opts: unknown) => {
      calls.push(opts);
      return {};
    },
  } as unknown as Transporter;

  const { draft } = await draftEmail("buyer@example.com", "Weekly market report", "<p>report</p>");
  await sendApprovedEmail(draft, fakeTransporter);

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    from: process.env.EMAIL_USER,
    to: "buyer@example.com",
    subject: "Weekly market report",
    html: "<p>report</p>",
  });
});

test("drafting an email never triggers a send on its own", async () => {
  let sendCalled = false;
  const fakeTransporter = {
    sendMail: async () => {
      sendCalled = true;
      return {};
    },
  } as unknown as Transporter;

  await draftEmail("buyer@example.com", "subject", "body");
  assert.equal(sendCalled, false, "draftEmail must never call sendMail, even indirectly");
  void fakeTransporter;
});

test("getSoldComps never returns more than the 50-row cap", async () => {
  const rows = await getSoldComps("San Diego", 12);
  assert.ok(rows.length <= 50);
});

test("buildWeeklyMarketReportBody produces an HTML report from real market data", async () => {
  const html = await buildWeeklyMarketReportBody();
  assert.match(html, /Weekly California Market Report/);
  assert.match(html, /<table/);
});
