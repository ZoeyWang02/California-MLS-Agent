import type { PropertyFilters } from "../types.js";

// Maps to rets_property columns per the Week 2 handbook filter table:
// city -> L_City, maxPrice -> L_SystemPrice, beds -> L_Keyword2,
// baths -> LM_Dec_3, sqft -> LM_Int2_3, type -> L_Type_,
// pool -> PoolPrivateYN, hasView -> ViewYN, maxHoa -> AssociationFee.

const TYPE_MAP: Record<string, string> = {
  condo: "Condominium",
  condos: "Condominium",
  townhome: "Townhouse",
  townhomes: "Townhouse",
  "single family": "SingleFamilyResidence",
  land: "UnimprovedLand",
};

export function parsePropertyQuery(query: string): PropertyFilters {
  const cityMatch = query.match(/in ([A-Za-z\s]+?)(?:\s+under|\s+with|\s+at|\s+below|$)/i);
  const priceMatch = query.match(/under \$?([\d,.]+)\s*(thousand|million|k|m)?/i);
  const bedsMatch = query.match(/(\d+)[\s-]*(bed|beds|bedroom|bedrooms)/i);
  const bathsMatch = query.match(/(\d+(?:\.5)?)[\s-]*(bath|baths|bathroom)/i);
  const sqftMatch = query.match(/([\d,]+)\s*(?:sqft|sq ft|square feet)/i);
  const hoaMatch = query.match(/hoa\D{0,15}\$?([\d,]+)/i);
  const poolMatch = /pool/i.test(query);
  const viewMatch = /view/i.test(query);

  const typeKey = Object.keys(TYPE_MAP).find((k) => query.toLowerCase().includes(k));

  let maxPrice: number | undefined;
  if (priceMatch) {
    maxPrice = Number(priceMatch[1].replace(/,/g, ""));
    const suffix = priceMatch[2]?.toLowerCase();
    if (suffix === "k" || suffix === "thousand") maxPrice *= 1_000;
    if (suffix === "m" || suffix === "million") maxPrice *= 1_000_000;
  }

  return {
    city: cityMatch?.[1]?.trim(),
    maxPrice,
    beds: bedsMatch ? Number(bedsMatch[1]) : undefined,
    baths: bathsMatch ? Number(bathsMatch[1]) : undefined,
    sqft: sqftMatch ? Number(sqftMatch[1].replace(/,/g, "")) : undefined,
    type: typeKey ? TYPE_MAP[typeKey] : undefined,
    pool: poolMatch ? "True" : undefined,
    hasView: viewMatch ? "True" : undefined,
    maxHoa: hoaMatch ? Number(hoaMatch[1].replace(/,/g, "")) : undefined,
  };
}
