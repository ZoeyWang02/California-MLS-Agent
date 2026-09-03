import nodemailer, { type Transporter } from "nodemailer";
import { getCityMarketSummary } from "./getMarketStats.js";

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

export interface DraftResult {
  draft: EmailDraft;
  status: "pending_approval";
}

let _transporter: Transporter | undefined;
function getTransporter(): Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    });
  }
  return _transporter;
}

export async function draftEmail(to: string, subject: string, body: string): Promise<DraftResult> {
  return { draft: { to, subject, body }, status: "pending_approval" };
}

export async function sendApprovedEmail(draft: EmailDraft, transporter: Transporter = getTransporter()): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: draft.to,
    subject: draft.subject,
    html: draft.body,
  });
}

export async function buildWeeklyMarketReportBody(): Promise<string> {
  const rows = await getCityMarketSummary();
  const top = rows.slice(0, 10);
  const tableRows = top
    .map(
      (r) =>
        `<tr><td>${r.City}</td><td>${r.sold_count}</td><td>$${Number(r.avg_close_price).toLocaleString()}</td>` +
        `<td>$${Number(r.median_close_price).toLocaleString()}</td><td>${r.avg_dom}</td><td>${r.list_to_close_pct}%</td></tr>`
    )
    .join("");
  return (
    "<h2>Weekly California Market Report</h2>" +
    "<table border=\"1\" cellpadding=\"6\" cellspacing=\"0\">" +
    "<tr><th>City</th><th>Sold (12mo)</th><th>Avg Price</th><th>Median Price</th><th>Avg DOM</th><th>List-to-Close</th></tr>" +
    `${tableRows}</table>`
  );
}
