import OpenAI from "openai";
import { conversationalPropertySearchSkill } from "./conversationalPropertySearchSkill.js";
import { formatPropertyCardForWhatsApp } from "../tools/formatPropertyCard.js";
import { getCityMarketSummary } from "../tools/getMarketStats.js";
import { getPriceTrend } from "../tools/getPriceTrend.js";
import { recommendSimilarListings } from "../tools/recommendListings.js";
import { ragAnswer } from "../tools/ragAnswer.js";
import { parsePropertyQuery } from "../nlp/parsePropertyQuery.js";
import { getSession } from "../session.js";

export type Intent = "search" | "market" | "recommend" | "knowledge" | "mixed";

export interface AgentResult {
  response: string;
}

let _client: OpenAI | undefined;
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI();
  return _client;
}

export async function classifyIntent(query: string): Promise<Intent> {
  const resp = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Classify the user's real estate query into exactly one label: " +
          "search (looking for properties by filters like city/price/beds), " +
          "market (asking about prices, trends, or market conditions), " +
          "recommend (wants listings similar to one they already liked), " +
          "knowledge (asking what a term or field means), or " +
          "mixed (asks for both a property search and market info in one message). " +
          "Respond with only the single label word, nothing else.",
      },
      { role: "user", content: query },
    ],
  });
  const label = resp.choices[0].message.content?.trim().toLowerCase();
  if (label === "search" || label === "market" || label === "recommend" || label === "knowledge" || label === "mixed") {
    return label;
  }
  return "search";
}

async function propertySearchAgent(query: string, userId: string): Promise<AgentResult> {
  const result = await conversationalPropertySearchSkill(userId, query, formatPropertyCardForWhatsApp);
  return { response: result.reply };
}

async function marketStatsAgent(query: string): Promise<AgentResult> {
  const { city } = parsePropertyQuery(query);
  if (city) {
    const rows = await getPriceTrend(city, 12);
    if (rows.length === 0) return { response: `No sold data found for ${city}.` };
    const text = rows
      .map(
        (r) =>
          `${r.month}: ${r.sales} sold, avg $${r.avg_price.toLocaleString()}, ${r.avg_dom} avg DOM` +
          (r.price_change_pct === null ? "" : ` (${r.price_change_pct >= 0 ? "+" : ""}${r.price_change_pct.toFixed(1)}% MoM)`)
      )
      .join("\n");
    return { response: `${city} price trend (last 12 months):\n${text}` };
  }
  const rows = await getCityMarketSummary();
  const text = rows
    .slice(0, 5)
    .map(
      (r) =>
        `${r.City}: ${r.sold_count} sold, avg $${Number(r.avg_close_price).toLocaleString()}, ` +
        `median $${Number(r.median_close_price).toLocaleString()}, ${r.avg_dom} avg DOM`
    )
    .join("\n");
  return { response: `Top markets by sold volume:\n${text}` };
}

async function recommendationAgent(listing?: { ListingKey: string }): Promise<AgentResult> {
  if (!listing) {
    return { response: "I don't have a recent listing to base recommendations on yet - search for homes first." };
  }
  const results = await recommendSimilarListings(listing.ListingKey, 5);
  if (results.length === 0) return { response: "No similar active listings found." };
  const text = results
    .map((r) => `${r.L_Type_} in ${r.L_City} — $${Number(r.L_SystemPrice).toLocaleString()} (score: ${r.score})`)
    .join("\n");
  return { response: text };
}

async function ragAgent(query: string): Promise<AgentResult> {
  const result = await ragAnswer(query);
  return { response: `${result.answer}\n\n(sources: ${result.sources.join(", ")})` };
}

function formatCombinedResponse(listings: AgentResult, stats: AgentResult): AgentResult {
  return { response: `${listings.response}\n\n---\n\n${stats.response}` };
}

export async function routeIntent(intent: Intent, query: string, userId: string): Promise<AgentResult> {
  switch (intent) {
    case "search":
      return await propertySearchAgent(query, userId);

    case "market":
      return await marketStatsAgent(query);

    case "recommend": {
      const session = getSession(userId);
      return await recommendationAgent(session.lastResults?.[0]);
    }

    case "knowledge":
      return await ragAgent(query);

    case "mixed": {
      const [listings, stats] = await Promise.all([propertySearchAgent(query, userId), marketStatsAgent(query)]);
      return formatCombinedResponse(listings, stats);
    }

    default:
      return { response: "I'm not sure how to help with that. Try asking about properties or market trends." };
  }
}

export async function orchestrate(query: string, userId: string): Promise<AgentResult> {
  const intent = await classifyIntent(query);
  return routeIntent(intent, query, userId);
}
