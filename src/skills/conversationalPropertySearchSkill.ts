import { parsePropertyQuery } from "../nlp/parsePropertyQuery.js";
import { searchActiveListings } from "../tools/searchActiveListings.js";
import { formatPropertyCard } from "../tools/formatPropertyCard.js";
import { getSession, updateSession } from "../session.js";
import type { UserSession } from "../types.js";

export interface ConversationalSearchResult {
  reply: string;
  awaitingInput: boolean;
  session: UserSession;
}

// Week 4: accumulates filters across turns via the session store (keyed by
// userId), asks for whatever's still missing (city, then budget), and only
// queries rets_property once enough is known - deterministic slot-filling,
// not the LLM re-inferring state from raw chat history each turn.
export async function conversationalPropertySearchSkill(
  userId: string,
  message: string
): Promise<ConversationalSearchResult> {
  const parsed = parsePropertyQuery(message);
  const current = getSession(userId);
  let session = updateSession(userId, {
    ...parsed,
    conversationStep: current.conversationStep + 1,
  });

  if (!session.city) {
    return { reply: "Which city are you looking in?", awaitingInput: true, session };
  }
  if (!session.maxPrice) {
    return { reply: "What is your budget?", awaitingInput: true, session };
  }
  const city = session.city;
  const maxPrice = session.maxPrice;

  const listings = await searchActiveListings(
    {
      city,
      maxPrice,
      beds: session.beds,
      baths: session.baths,
      sqft: session.sqft,
      type: session.type,
      pool: session.pool,
      hasView: session.hasView,
      maxHoa: session.maxHoa,
    },
    1,
    5
  );

  session = updateSession(userId, { lastResults: listings });

  if (listings.length === 0) {
    return {
      reply: `No active listings matched yet (city: ${city}, budget: $${maxPrice.toLocaleString()}). Try adjusting your criteria.`,
      awaitingInput: true,
      session,
    };
  }

  return { reply: listings.map(formatPropertyCard).join("\n\n"), awaitingInput: false, session };
}
