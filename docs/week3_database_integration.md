# Week 3 MLS Database Integration

## Goal

Connect the Week 2 parser to both MLS tables with a parameterized, paginated query layer, and return formatted property cards — the natural-language front end from Week 2 feeding directly into the database layer.

## Field Naming

`rets_property` uses legacy RETS column names (`L_Keyword2`, `LM_Dec_3`, ...). `california_sold` already uses RESO-standard field names (`BedroomsTotal`, `BathroomsTotalInteger`, `LivingArea`, ...). To keep active-listing results and sold-comp results speaking the same vocabulary (needed for joins, comps validation, and merging results in later weeks), `searchActiveListings` aliases every selected `rets_property` column to its RESO equivalent. See [`ListingRow`](../src/types.ts) and [`SoldRow`](../src/types.ts).

| RETS column (`rets_property`) | RESO field (query alias / `california_sold`) |
| --- | --- |
| `L_ListingID` | `ListingKey` |
| `L_Address` | `UnparsedAddress` |
| `L_Zip` | `PostalCode` |
| `L_SystemPrice` | `ListPrice` |
| `L_Keyword2` | `BedroomsTotal` |
| `LM_Dec_3` | `BathroomsTotalInteger` |
| `LM_Int2_3` | `LivingArea` |
| `L_Type_` | `PropertySubType` |
| `L_Status` | `MlsStatus` |
| `LMD_MP_Latitude` / `LMD_MP_Longitude` | `Latitude` / `Longitude` |
| `PhotoCount` | `PhotosCount` |
| `LA1_UserFirstName` / `LA1_UserLastName` | `ListAgentFirstName` / `ListAgentLastName` |
| `LO1_OrganizationName` | `ListOfficeName` |

## Code

- [`src/db.ts`](../src/db.ts) — `mysql2/promise` connection pool + generic `query<T>()` helper
- [`src/tools/searchActiveListings.ts`](../src/tools/searchActiveListings.ts) — parameterized, paginated search over `rets_property` (`page`/`limit` → `LIMIT`/`OFFSET`)
- [`src/tools/getSoldComps.ts`](../src/tools/getSoldComps.ts) — sold comps lookup over `california_sold` by city + trailing months
- [`src/tools/formatPropertyCard.ts`](../src/tools/formatPropertyCard.ts) — turns a `ListingRow` into a short, human-readable card
- [`src/skills/propertySearchSkill.ts`](../src/skills/propertySearchSkill.ts) — the actual Week 3 skill: takes a free-text query, runs it through `parsePropertyQuery` (Week 2), queries `rets_property`, and returns formatted cards

## Example

```ts
import { propertySearchSkill } from "./src/skills/propertySearchSkill.js";

const result = await propertySearchSkill(
  "Show me 3-bedroom condos in Irvine under $1.5M with a pool.",
  1,
  10
);
// result.filters -> parsed PropertyFilters from Week 2
// result.cards   -> formatted property card strings
```

## Tests

[`tests/formatPropertyCard.test.ts`](../tests/formatPropertyCard.test.ts) covers the formatter as a pure function (full listing, and missing price/sqft/DOM fallback text). `searchActiveListings` / `getSoldComps` / `propertySearchSkill` require a live MySQL connection and are exercised manually against the local `idx_exchange` database rather than mocked in the unit suite.

Run all tests:

```powershell
npm install
npm test
```

## Deliverable

`propertySearchSkill` accepts NLP filters from Week 2, queries `rets_property`, and returns formatted property cards — matching the Week 3 handbook deliverable.
