# Trestle RESO Field Definitions — california_sold columns

Source: Trestle Property MetaData (CoreLogic Trestle `Property` resource, RESO Data Dictionary), `https://api-trestle.corelogic.com/trestle/Documentation/MetaData/Resource/Property`. Trestle's full Property resource has several hundred fields (agents, offices, financials, utilities, etc.); this document is filtered to only the fields that appear in this project's `california_sold` table, using Trestle's authoritative definitions rather than paraphrased ones. Per the project mentor's guidance, `california_sold` already uses RESO-standard field names and maps almost entirely to Trestle.

The columns in `california_sold` are:

| Field | Type | Trestle Definition |
| --- | --- | --- |
| ListingKey | String | A unique identifier for this record from the immediate source. This is a string that can include a Uniform Resource Identifier (URI) or other forms. This is the local key of the system. |
| ClosePrice | Decimal | The amount of money paid by the purchaser to the seller for the property under the agreement. |
| CloseDate | DateTime | With for-sale listings, the date the purchase agreement was fulfilled. With lease listings, the date the requirements were fulfilled, such as contract and/or deposit. |
| OriginalListPrice | Decimal | The original price of the property on the initial agreement between the seller and the seller's broker. |
| ListPrice | Decimal | The current price of the property as determined by the seller and the seller's broker. For auctions this is the minimum or reserve price. |
| DaysOnMarket | Int32 | The number of days the listing is on market, as defined by the MLS business rules. |
| PropertyType | Enum | A list of types of properties such as Residential, Lease, Income, Land, Mobile, Commercial Sale, etc. |
| PropertySubType | Enum | A list of sub types to Residential, Residential Lease, Manufactured in Park, Commercial and Business Opportunity listings. E.g. Single Family Residence, Condominium, Manufactured on Land, Townhouse, Multi Family, Office, Retail, etc. |
| LivingArea | Decimal | The total livable area within the structure. |
| LotSizeAcres | Decimal | The total Acres of the lot. This field is related to the Lot Size Area and Lot Size Units and must be in sync with the values represented in those fields. |
| LotSizeSquareFeet | Decimal | The total square footage of the lot. This field is related to the Lot Size Area and Lot Size Units and must be in sync with those fields. |
| BedroomsTotal | Int32 | The total number of bedrooms in the dwelling. |
| BathroomsTotalInteger | Int32 | The simple sum of the number of bathrooms. For example, for a property with two Full Bathrooms and one Half Bathroom, the Bathrooms Total Integer will be 3. Decimal-based bathrooms (e.g. 2.5) are not the recommended representation for this field. |
| YearBuilt | Int32 | The year that an occupancy permit is first granted for the house or other local measure of initial habitability of the build. |
| City | String | The city in listing address. |
| PostalCode | String | The postal code portion of a street or mailing address. |
| Latitude | Decimal | The geographic latitude of some reference point on the property, specified in degrees and decimal parts. |
| Longitude | Decimal | The geographic longitude of some reference point on the property, specified in degrees and decimal parts. |
| UnparsedAddress | String | A text representation of the address with the full civic location as a single entity. May optionally include City, StateOrProvince, PostalCode and Country. |
| ListAgentFirstName / ListAgentLastName / ListAgentFullName | String | The first / last / full (First Middle Last) name of the listing agent. |
| BuyerAgentFirstName / BuyerAgentLastName | String | The first / last name of the buyer's agent. |
| ListOfficeName | String | The legal name of the brokerage representing the seller. |
| BuyerOfficeName | String | The legal name of the brokerage representing the buyer. |
| PoolPrivateYN | Boolean | The property has a privately owned pool that is included in the sale/lease. |
| ViewYN | Boolean | The property has a view. |
| FireplaceYN | Boolean | Does the property include a fireplace. |
| NewConstructionYN | Boolean | Is the property newly constructed and has not been previously occupied. |
| GarageSpaces | Decimal | The number of spaces in the garage(s). |
| AssociationFee | Decimal | A fee paid by the homeowner to the Home Owners Association which is used for the upkeep of the common area, neighborhood or other association related benefits. |
| SubdivisionName | String | A neighborhood, community, complex or builder tract. |
| HighSchoolDistrict | String | The name of the high school district having a catchment area that includes the associated property. |
| ListingContractDate | DateTime | The effective date of the agreement between the seller and the seller's broker. |
| PurchaseContractDate | DateTime | With for-sale listings, the date an offer was accepted and the listing was no longer on market. |
