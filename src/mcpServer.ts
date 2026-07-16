import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Load .env from the current working directory (the process is always
// started with --cwd set to the project root) without ever printing it.
// This must run before importing anything that touches db.ts, since that
// module creates its MySQL pool from process.env at import time.
const envPath = join(process.cwd(), ".env");
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

const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = await import("zod");
const { propertySearchSkill } = await import("./skills/propertySearchSkill.js");
const { getSoldComps } = await import("./tools/getSoldComps.js");

const server = new McpServer({
  name: "california-mls-agent",
  version: "0.1.0",
});

server.registerTool(
  "property_search",
  {
    title: "Search active MLS listings",
    description:
      "Parse a free-text real estate query (city, price, beds, baths, sqft, type, pool, view, HOA) " +
      "and search active listings in the local rets_property MySQL table. Returns formatted property cards.",
    inputSchema: {
      query: z.string().describe("Free-text property search, e.g. '3 bedroom condos in Irvine under $1.5M with a pool'"),
      page: z.number().int().min(1).optional().describe("Page number, defaults to 1"),
      limit: z.number().int().min(1).max(50).optional().describe("Results per page, defaults to 10"),
    },
  },
  async ({ query, page, limit }: { query: string; page?: number; limit?: number }) => {
    const result = await propertySearchSkill(query, page ?? 1, limit ?? 10);
    const text =
      result.count === 0
        ? `No active listings matched: ${JSON.stringify(result.filters)}`
        : result.cards.join("\n\n");
    return { content: [{ type: "text" as const, text }] };
  }
);

server.registerTool(
  "sold_comps",
  {
    title: "Look up sold comps",
    description: "Look up recent sold/closed comps for a city from the local california_sold MySQL table.",
    inputSchema: {
      city: z.string().describe("City name, e.g. 'Irvine'"),
      months: z.number().int().min(1).max(60).optional().describe("Trailing months to search, defaults to 12"),
    },
  },
  async ({ city, months }: { city: string; months?: number }) => {
    const comps = await getSoldComps(city, months ?? 12);
    if (comps.length === 0) {
      return { content: [{ type: "text" as const, text: `No sold comps found for ${city}.` }] };
    }
    const text = comps
      .slice(0, 10)
      .map(
        (c) =>
          `${c.UnparsedAddress}, ${c.City} — $${c.ClosePrice.toLocaleString()} (closed ${c.CloseDate}), ` +
          `${c.BedroomsTotal}bd/${c.BathroomsTotalInteger}ba, ${c.LivingArea?.toLocaleString() ?? "?"} sqft`
      )
      .join("\n");
    return { content: [{ type: "text" as const, text: `${comps.length} comps found. Showing up to 10:\n\n${text}` }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
