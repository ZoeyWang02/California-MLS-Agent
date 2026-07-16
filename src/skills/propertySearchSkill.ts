import { parsePropertyQuery } from "../nlp/parsePropertyQuery.js";
import { searchActiveListings } from "../tools/searchActiveListings.js";
import { formatPropertyCard } from "../tools/formatPropertyCard.js";

// Week 3 deliverable: accepts a free-text query, runs it through the Week 2
// parser, queries rets_property, and returns formatted property cards.
export async function propertySearchSkill(query: string, page = 1, limit = 10) {
  const filters = parsePropertyQuery(query);
  const listings = await searchActiveListings(filters, page, limit);

  return {
    filters,
    count: listings.length,
    cards: listings.map(formatPropertyCard),
  };
}
