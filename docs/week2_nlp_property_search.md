# Week 2 Natural Language Property Search

## Goal

Week 2 builds the natural language front-end for active listing search. The parser accepts a free-text real estate query and returns a structured filter object that can later be passed into the Week 3 database query layer.

Example:

```text
Show me 3-bedroom condos in Irvine under $1.5M with a pool.
```

Parsed output:

```json
{
  "city": "Irvine",
  "maxPrice": 1500000,
  "beds": 3,
  "type": "Condominium",
  "pool": "True"
}
```

## Supported Filters

| User intent | Parser field | Database column |
| --- | --- | --- |
| city | `city` | `L_City` |
| max price | `maxPrice` | `L_SystemPrice` |
| min bedrooms | `beds` | `L_Keyword2` |
| min bathrooms | `baths` | `LM_Dec_3` |
| min square feet | `sqft` | `LM_Int2_3` |
| property type | `type` | `L_Type_` |
| pool | `pool` | `PoolPrivateYN` |
| view | `hasView` | `ViewYN` |
| max HOA | `maxHoa` | `AssociationFee` |

## Code

Main implementation:

- [`src/nlp/parsePropertyQuery.ts`](../src/nlp/parsePropertyQuery.ts)
- [`tests/parsePropertyQuery.test.ts`](../tests/parsePropertyQuery.test.ts)

The parser is deterministic (regex-based) and does not require an OpenAI API key. This lets us validate Week 2 behavior while model credentials are still pending.

Run tests:

```powershell
npm install
npm test
```

## Validation Queries

The test suite covers 11 query patterns:

- city
- max price with `k`, `m`, and comma formats
- bedroom count
- bathroom count
- square footage, including comma-formatted values
- condo mapping
- townhome mapping
- single-family mapping
- land mapping
- pool and view flags
- HOA max fee
- no-match query (all fields undefined)

## Current Data Status

Both SQL files were re-imported into the `idx_exchange` schema. Current local counts:

| Table | Rows |
| --- | ---: |
| `rets_property` | 53,122 |
| `california_sold` | 87,157 |

These counts are lower than the handbook's approximate expected counts, so the local SQL files may be partial exports. The parser and tool interfaces remain usable, but final Week 0 validation should use the complete project-provided datasets.
