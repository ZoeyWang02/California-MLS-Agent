import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPropertyCard } from "../src/tools/formatPropertyCard.js";
import type { ListingRow } from "../src/types.js";

const baseListing: ListingRow = {
  ListingKey: "12345",
  L_DisplayId: "OC12345",
  UnparsedAddress: "123 Main St",
  City: "Irvine",
  PostalCode: "92602",
  ListPrice: 1250000,
  BedroomsTotal: 3,
  BathroomsTotalInteger: 2,
  LivingArea: 1800,
  PropertySubType: "Condominium",
  MlsStatus: "Active",
  Latitude: 33.68,
  Longitude: -117.79,
  YearBuilt: 2015,
  AssociationFee: 300,
  DaysOnMarket: 12,
  PoolPrivateYN: "True",
  ViewYN: "False",
  FireplaceYN: "True",
  PhotosCount: 24,
  ListAgentFirstName: "Jane",
  ListAgentLastName: "Doe",
  ListOfficeName: "Acme Realty",
};

test("formats a full listing into a two-line card", () => {
  const card = formatPropertyCard(baseListing);
  assert.equal(
    card,
    "123 Main St, Irvine — $1,250,000\n3bd/2ba | 1,800 sqft | 12 days on market"
  );
});

test("falls back gracefully when price and sqft are missing", () => {
  const card = formatPropertyCard({
    ...baseListing,
    ListPrice: 0,
    LivingArea: 0,
    DaysOnMarket: 0,
  });
  assert.equal(
    card,
    "123 Main St, Irvine — Price on request\n3bd/2ba | sqft n/a | 0 days on market"
  );
});
