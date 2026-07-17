import type { ListingRow } from "../types.js";

export function formatPropertyCard(listing: ListingRow): string {
  const price = listing.ListPrice ? `$${listing.ListPrice.toLocaleString()}` : "Price on request";
  const beds = listing.BedroomsTotal ?? "?";
  const baths = listing.BathroomsTotalInteger ?? "?";
  const sqft = listing.LivingArea ? `${listing.LivingArea.toLocaleString()} sqft` : "sqft n/a";
  const dom = listing.DaysOnMarket ?? "?";
  const photos = listing.PhotosCount ?? 0;

  return (
    `${listing.UnparsedAddress}, ${listing.City} — ${price}\n` +
    `${beds}bd/${baths}ba | ${sqft} | ${dom} days on market | ${photos} photos`
  );
}
