# Real Estate Data Analyst Primer

Source: IDX Exchange "Real Estate Data Analyst Primer" (for analysts with data experience entering the real estate domain).

## 1. Where the Data Comes From: The MLS

The dataset originates from CRMLS — the California Regional Multiple Listing Service — one of the largest MLS systems in the United States, covering much of Southern California. A Multiple Listing Service (MLS) is a private, cooperative database operated by a regional association of real estate brokers. Agents use it to share listing information with each other — a centralized marketplace for properties. There is no single national MLS; each region operates its own (e.g. CRMLS for Southern California, NWMLS for the Pacific Northwest, MRED for the Chicago area).

Consumer-facing sites like Zillow and Redfin pull data from MLS feeds via licensed agreements — when you see a listing on Zillow, you are almost always looking at data that originated in an MLS.

Key fields populated when a listing agent enters a property: ListingKey, ListingContractDate, ListPrice, ClosePrice, PurchaseContractDate, CloseDate, LivingArea, BedroomsTotal, BathroomsTotalInteger, Latitude/Longitude, UnparsedAddress.

## 2. The Transaction Lifecycle

Real estate data captures a sequential business process, not just a snapshot. Each field maps to a specific stage.

**Stage 1 — Listing**: The seller signs a listing agreement with a licensed agent, who enters the property into the MLS. ListPrice, LivingArea, BedroomsTotal, and address fields are populated. The property becomes part of active market supply.

**Stage 2 — Buyer Preapproval & Offers**: Buyers typically obtain mortgage preapproval (confirms borrowing capacity based on income, credit score, debt-to-income ratio) before submitting an offer. Listings receiving many competing offers in a short window often close above list price — detectable by comparing ListPrice vs. ClosePrice alongside days-on-market. A large downward gap between list and close price may signal an overpriced listing or deteriorating market conditions.

**Stage 3 — Purchase Agreement & Escrow**: When an offer is accepted, both parties sign a purchase agreement locking in price, contingencies, and a closing date (typically 30-45 days out, negotiable). That agreed date becomes CloseDate. Status changes to Pending. Common contingencies: inspection contingency (buyer can cancel/renegotiate if inspection reveals issues), appraisal contingency (protects buyer if lender's appraisal comes in low), financing contingency (buyer can exit if loan falls through). Escrow is a neutral third-party account (title company/escrow officer) holding funds until every condition is met, covering home inspection, appraisal, loan underwriting, title search, and final paperwork. If a contingency fails, the deal is cancelled and status reverts to Active, often labeled Back on Market (BOM) — a property may show multiple listing records or status changes; this is not a data error.

**Stage 4 — Close**: When all contingencies clear, escrow closes: funds transfer, the deed is recorded, ownership changes hands. CloseDate and ClosePrice are recorded. These fields only exist in sold records — active listings that never sell will never have them, a critical structural difference between listings and sold datasets.

## 3. List Price vs. Close Price

ListPrice is the marketing/asking price, reflecting seller expectations and agent strategy. ClosePrice is the true transaction value — use this for price trend analysis.

The **sale-to-list ratio** (ClosePrice ÷ ListPrice) is a key market health indicator. Above 1.0 (close > list) signals a competitive seller's market — often from multiple competing offers, sometimes with buyers waiving contingencies to strengthen their offer. Below 1.0 signals buyer leverage or an overpriced listing.

Example: ListPrice $875,000, ClosePrice $901,000 → sale-to-list ratio = $901,000 ÷ $875,000 = 1.030 → sold 3% over asking. Aggregated across ZIP codes and time periods, this is a powerful proxy for local market momentum.

## 4. Commission Structure and Agent Fields

Real estate commissions are typically 5-6% of sale price, historically split between the listing agent (seller's side) and buyer's agent. Since 2024, NAR settlement changes mean buyer-agent fees are negotiated separately rather than automatically offered through the MLS.

Agent relationships appear as: ListAgentFirstName/ListAgentLastName/ListOfficeName (listing side), BuyerAgentFirstName/BuyerAgentLastName/BuyerOfficeName (buyer side) — enabling brokerage-level performance analysis (volume by office, sale-to-list ratio by agent, market share by brokerage).

Neither buyer nor seller pays agent fees upfront — for the seller, commission is deducted from sale proceeds at closing; for the buyer, payment also happens at closing. Commissions are fully contingent on the deal closing; if a transaction falls through, neither agent is paid.

## 5. Home Financing Basics

Most buyers finance with a mortgage rather than paying cash. Down payment tiers: Low 3-5% (requires PMI), Mid 10%, Standard 20% (eliminates PMI, signals a strong buyer), High 25%+ (common for investors/jumbo loans). On a $500,000 home, 20% down = $100,000, leaving a $400,000 loan.

The 30-year fixed-rate mortgage is the most common U.S. loan structure — rate locked for the loan's life, payments spread over 360 months. Rates have ranged roughly 3% (2021) to over 7% (2023-2024). At $400,000 loan principal: 3.0% rate → $1,686/mo ($607,110 total cost); 6.0% → $2,398/mo ($863,353 total); 7.5% → $2,797/mo ($1,007,024 total). Rising rates directly compress buyer purchasing power and are a primary driver of transaction volume slowdowns — when ClosePrice trends flatten or dip, rising rates are often the underlying cause.

## 6. Listings Dataset vs. Sold Dataset

**Listings dataset**: all properties entered into the MLS — active, expired, withdrawn, and sold. Use for supply analysis.

**Sold dataset**: subset of listings that completed a transaction. Always has ClosePrice and CloseDate. Use for price and volume analysis.

## 7. MLS Status Codes (StandardStatus)

| Status | Meaning | Usage note |
| --- | --- | --- |
| Active | Live and available | Current inventory/supply analysis; DOM actively accumulating |
| Pending | Under contract, not yet closed | Offer accepted, purchase agreement signed; excluded from active supply; ClosePrice not yet set |
| Closed | Transaction completed | ClosePrice and CloseDate populated; use for price trend and volume analysis |
| Back on Market | Returned to Active after Pending | Deal fell through; property available again; DOM clock may have reset |
| Expired | Listing term ended without a sale | Seller did not renew; useful for analyzing overpriced/hard-to-sell properties |
| Withdrawn | Seller pulled listing before expiry | May indicate a change in seller circumstances |

Always filter to `StandardStatus = Closed` for price trend analyses, and to `StandardStatus = Active` for active inventory. Mixing statuses (e.g. including Pending in a price analysis) is a common source of error since Pending records lack a confirmed ClosePrice.

## 8. Days on Market (DOM)

DOM measures how long a property has been listed before going under contract or selling — a direct demand indicator. Low DOM signals a hot market; high DOM signals soft demand or an overpriced listing.

DOM is calculated as calendar days between ListingContractDate and either the date status changed to Pending, or CloseDate, depending on the platform. **CDOM (Cumulative Days on Market)** adds together DOM across multiple listing periods for the same property — useful for spotting relisted properties (after expiring or falling out of contract); resets only on ownership change.

Interpretation: Very Low (1-7 days) = extremely competitive, likely multiple offers quickly; Low (8-30 days) = healthy demand, normal for active markets; Average (31-60 days) = moderate, possible seasonal slowdown or slight overpricing; High (60+ days) = weak demand, possible overpricing/condition issues/low buyer interest.

## 9. Property Types

| Type | Description | Note |
| --- | --- | --- |
| Single Family | Detached home on its own lot | Most common; owner controls the land; typically highest price per unit; benchmark for most market analyses |
| Condo | Unit within a multi-unit building | Owner holds the interior unit, common areas shared; subject to HOA fees; price/sqft differs significantly from SFR |
| Townhouse | Attached home, usually multi-story | Shares one or two walls; hybrid between SFR and condo in pricing/ownership |
| Multi-Family | 2-4 unit residential property | Investor-oriented; priced on income potential (cap rate) as much as comps; analyze separately from owner-occupied types |
| Manufactured | Factory-built home on leased or owned land | Often lower price points; may not qualify for conventional financing |

Always filter by PropertyType before calculating median price, price per sq ft, or DOM — a ZIP code median mixing condos and single-family homes is skewed by sales composition, not just price movement. Single Family Residential (SFR) is the standard benchmark used by analysts and media.

## 10. The Analytics Workflow

Four-stage production pipeline (mirrors workflows at Zillow, Redfin, CoStar, regional brokerages): (1) Raw API Data — JSON/CSV pulls from CRMLS or vendors, may have nulls/type inconsistencies; (2) Python Cleaning — standardize types, handle missing values, deduplicate, outlier treatment, feature engineering (price per sq ft, DOM); (3) Structured Datasets — clean analysis-ready tables by business object (listings, transactions, agents, offices); (4) Tableau Dashboards — price trend charts, ZIP heat maps, agent leaderboards, DOM distributions.

## 11. The Analyst Mindset

Technical skills (SQL, Python, Tableau) are table stakes. What separates a strong analyst from a capable technician is domain knowledge: understanding where data comes from, what business process generated it, and what it can and cannot answer. Keep asking: **Context** (what does this field represent in the real world?), **Skepticism** (why does this value look this way, and when might it be wrong?), **Purpose** (what decision or insight does this enable?).
