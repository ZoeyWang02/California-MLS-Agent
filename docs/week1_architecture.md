# Week 1 Architecture: OpenClaw MLS Assistant

## Goal

Week 1 focuses on understanding and documenting how OpenClaw routes a user message from WhatsApp into skills, tools, memory, and the MLS database. This week does not require a finished AI assistant. The expected deliverable is architecture documentation with a workflow diagram.

## System Overview

The assistant is designed as a multi-agent real estate workflow. A user sends a natural language request through WhatsApp, OpenClaw receives the message through its channel layer, the runtime selects the right skill, the skill calls typed tools, and the tools query the local MySQL database.

Primary workflow:

```text
User -> WhatsApp -> OpenClaw Runtime -> Skill Selector -> Tool Execution -> Memory Update -> Response -> User
```

## Key Components

### WhatsApp Channel

The WhatsApp channel is the user-facing communication layer. It receives direct messages from the user, passes message text and sender context into OpenClaw, and returns the final formatted response.

For local Week 0 and Week 1 testing, WhatsApp setup can be blocked by provider authentication or linked-device issues. The architecture still remains the same even if the OpenAI API key is not available yet.

### OpenClaw Runtime

The runtime coordinates message handling. It receives normalized channel events, creates or resumes a session for the user, and passes the request into the orchestration flow.

Responsibilities:

- Normalize incoming channel messages
- Load user/session context
- Call the skill selector
- Execute selected skills and tools
- Persist memory updates
- Return a channel-ready response

### Skill Selector

The skill selector decides which capability should handle the user's request. In this project, likely skills include property search, market statistics, comparable sales, recommendations, and later RAG over MLS documentation.

Example routing decisions:

| User intent | Likely skill |
| --- | --- |
| "Find homes in Irvine under 1.2M" | Property search |
| "What are comps for this address?" | Comparable sales |
| "How is the San Diego market?" | Market statistics |
| "Recommend homes similar to this one" | Recommendation |
| "What does this MLS field mean?" | RAG knowledge assistant |

### Skills

Skills are modular capability units. A skill should contain task-specific logic and call tools rather than querying the database directly from channel code.

Initial skill candidates:

- `property_search`: query active listings from `rets_property`
- `market_stats`: summarize sold comps from `california_sold`
- `comparable_sales`: find nearby or similar sold properties
- `recommendations`: combine active listings and sold comps for suggestions
- `rag_knowledge`: answer questions from MLS field definitions and project docs

### Tools

Tools are typed functions the assistant can call to perform reliable operations. They should take structured inputs and return structured outputs.

Potential Week 1 tool interfaces:

```ts
type PropertyFilters = {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  minSqft?: number;
  maxDaysOnMarket?: number;
};

async function searchProperties(filters: PropertyFilters) {
  // Query rets_property.
}

async function getComparableSales(input: {
  city?: string;
  zip?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
}) {
  // Query california_sold.
}

async function getMarketStats(input: {
  city?: string;
  zip?: string;
  startDate?: string;
  endDate?: string;
}) {
  // Aggregate california_sold.
}
```

### Memory and Sessions

Session memory tracks the current conversation for each user. It should help the assistant resolve follow-up questions such as "show me cheaper ones" or "what about sold comps nearby?"

Examples of useful session memory:

- Last searched city or ZIP code
- Last price range
- Previously shown listing IDs
- User preference signals such as bedrooms, budget, commute, or property type
- Whether the user is asking a follow-up question

Long-term memory or vector storage can be added later for semantic preferences, document retrieval, or saved searches.

## Data Layer

The local MySQL database is named `idx_exchange`.

Expected tables:

| Table | Purpose | Expected source |
| --- | --- | --- |
| `rets_property` | Active property listings | `rets_property.sql` |
| `california_sold` | Sold comparable properties | `california_sold.sql` |

Current data note:

- `california_sold.sql` imported successfully in local testing, but the row count is lower than the handbook estimate.
- `rets_property.sql` appears incomplete because the file ends mid-INSERT near an image URL field. A complete replacement file should be requested from the project owner.
- OpenAI API key is still pending, so LLM-driven routing and responses cannot be fully verified yet.

## Query Flow

1. User sends a WhatsApp message.
2. WhatsApp channel receives the message and sender metadata.
3. OpenClaw runtime opens the user's session.
4. Skill selector classifies the request.
5. Selected skill calls one or more tools.
6. Tools query `idx_exchange`.
7. Tool results are normalized into structured listings, comps, or market summaries.
8. Runtime updates session memory.
9. Assistant formats a WhatsApp-friendly response.
10. WhatsApp channel sends the response back to the user.

## Example User Flows

### Property Search

User message:

```text
Find 3 bedroom homes in Irvine under $1.2M.
```

Expected flow:

```text
WhatsApp -> Runtime -> property_search skill -> searchProperties() -> rets_property -> formatted listings
```

Expected response content:

- Address or neighborhood
- Price
- Beds, baths, square footage
- Days on market
- Short reason why it matched

### Comparable Sales

User message:

```text
Show me sold comps for homes like this in Pasadena.
```

Expected flow:

```text
WhatsApp -> Runtime -> comparable_sales skill -> getComparableSales() -> california_sold -> comp summary
```

Expected response content:

- Comparable sold properties
- Sold prices
- Sold dates
- Median or average sale price
- Notes about similarity

### Follow-Up Search

User message:

```text
Show me cheaper ones.
```

Expected flow:

```text
WhatsApp -> Runtime -> session memory -> property_search skill -> searchProperties() with adjusted price -> response
```

The assistant should use session memory to infer that "ones" refers to the previous property search.

## Week 1 Deliverables

- Architecture documentation describing OpenClaw runtime, channels, skills, tools, memory, and database flow
- Workflow diagram showing WhatsApp to OpenClaw to MLS database path
- Notes on current blockers and assumptions
- Initial tool interface sketch for future implementation

## Open Questions

- Which model provider should be used if the project OpenAI API key is not available?
- Will the project owner provide a complete `rets_property.sql` replacement?
- Should WhatsApp testing use a personal number or a dedicated project number?
- What exact MLS fields should be prioritized for search filters and result display?
