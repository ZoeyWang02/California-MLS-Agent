# rets_property Field Definitions — Active Listings

`rets_property` is the MySQL table (in the `idx_exchange` schema) holding active MLS property listings. It uses legacy RETS field names — terse, non-obvious column names inherited from the older RETS data-exchange standard, unlike `california_sold` which uses modern RESO-standard names.

The columns in `rets_property` are:

| Column | Type | Description |
| --- | --- | --- |
| id | INT PK | Auto-increment primary key |
| L_ListingID | VARCHAR | MLS system listing ID — joins to california_sold.ListingKey |
| L_DisplayId | VARCHAR | Human-readable MLS number shown on portals |
| L_Address | VARCHAR | Full street address |
| L_City | VARCHAR | City — indexed for fast city-based queries |
| L_Zip | VARCHAR | Postal code — indexed |
| L_Class | VARCHAR | Property class: Residential, CommercialSale, Land, etc. |
| L_Type_ | VARCHAR | Subtype: SingleFamilyResidence, Condominium, etc. — indexed |
| L_Keyword2 | INT | Bedrooms total |
| LM_Dec_3 | DECIMAL(4,1) | Bathrooms total (supports half-baths, e.g. 2.5) |
| L_SystemPrice | INT | Current list price (search/display price) |
| LM_Int2_3 | INT | Approximate finished square footage |
| L_Keyword1 | VARCHAR | Lot size (string, often sq ft or acres) |
| LMD_MP_Latitude / LMD_MP_Longitude | DECIMAL | Geo coordinates, high precision |
| L_Status | VARCHAR | Listing status: Active, Pending, Withdrawn, etc. |
| L_Remarks | MEDIUMTEXT | Full listing description — FULLTEXT indexed (ft_remarks) |
| L_Photos | LONGTEXT | JSON array of listing photo URLs |
| LA1_UserFirstName / LA1_UserLastName | VARCHAR | Listing agent name |
| ListAgentEmail / ListAgentDirectPhone | VARCHAR | Listing agent contact info |
| LO1_OrganizationName | VARCHAR | Listing office / brokerage name |
| ListingContractDate | DATE | Date listing agreement was signed |
| YearBuilt | INT | Year property was constructed |
| SubdivisionName | VARCHAR | Subdivision or community name |
| AssociationFee | INT | Monthly HOA fee in dollars |
| AssociationAmenities | TEXT | HOA amenities: Golf, Pool, Tennis, etc. |
| DaysOnMarket | INT | Days on market at time of data pull |
| PoolPrivateYN / FireplaceYN / ViewYN | VARCHAR | True/False flags |
| View | VARCHAR | View description: Mountains, Ocean, GolfCourse, etc. |
| LotSizeAcres / LotSizeSquareFeet | DECIMAL | Lot size |
| PreviousListPrice | DECIMAL | Prior list price — enables price reduction analysis |
| StandardStatus | VARCHAR | RESO standard status: Active, Pending, Closed |
| CountyOrParish | VARCHAR | County name |
| ParcelNumber | VARCHAR | Assessor parcel number (APN) |
| Cooling / Heating | VARCHAR | HVAC system type |
| ArchitecturalStyle | VARCHAR | Modern, Ranch, Mediterranean, etc. |
| PhotoCount | INT | Number of listing photos |
| ModificationTimestamp | DATETIME | Last modification timestamp |

To correlate a `rets_property` row with its sold comps in `california_sold`: `JOIN rets_property r ON CAST(r.L_ListingID AS UNSIGNED) = cs.ListingKey`.
