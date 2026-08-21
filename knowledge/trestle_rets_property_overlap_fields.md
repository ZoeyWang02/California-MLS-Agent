# Trestle RESO Field Definitions — rets_property fields that match RESO directly

Source: Trestle Property MetaData (CoreLogic Trestle `Property` resource, RESO Data Dictionary). These `rets_property` fields happen to use the same names as Trestle/RESO and are documented here with Trestle's authoritative definitions. This does NOT cover `rets_property`'s core search fields (`L_SystemPrice`, `L_Keyword2`, `LM_Dec_3`, `LM_Int2_3`, `L_City`, `L_Address`, etc.), which use IDX's own legacy naming and are not in Trestle at all — see `rets_property_fields.md` (indexed from the handbook's own schema reference) for those.

| Field | Type | Trestle Definition |
| --- | --- | --- |
| StandardStatus | Enum | The status of the listing as it reflects the state of the contract between the listing agent and seller or an agreement with a buyer (Active, Active Under Contract, Canceled, Closed, Expired, Pending, Withdrawn). Single Select. |
| YearBuilt | Int32 | The year that an occupancy permit is first granted for the house or other local measure of initial habitability of the build. |
| AssociationFee | Decimal | A fee paid by the homeowner to the Home Owners Association which is used for the upkeep of the common area, neighborhood or other association related benefits. |
| AssociationAmenities | Enum | Amenities provided by the Home Owners Association, Mobile Park or Complex. For example Pool, Clubhouse, etc. |
| PoolPrivateYN | Boolean | The property has a privately owned pool that is included in the sale/lease. |
| ViewYN | Boolean | The property has a view. |
| View | Enum | A view as seen from the listed property. |
| FireplaceYN | Boolean | Does the property include a fireplace. |
| ArchitecturalStyle | Enum | A list describing the style of the structure. For example, Victorian, Ranch, Craftsman, etc. |
| Cooling | Enum | A list describing the cooling or air conditioning features of the property. |
| Heating | Enum | A list describing the heating features of the property. |
| CountyOrParish | String | The County, Parish or other regional authority. |
| ParcelNumber | String | A number used to uniquely identify a parcel or lot. Typically issued by the county or county assessor. |
| DaysOnMarket | Int32 | The number of days the listing is on market, as defined by the MLS business rules. |
| PhotosCount (PhotoCount) | Int32 | The total number of pictures or photos included with the listing. |
| ModificationTimestamp | DateTimeOffset | The transactional timestamp automatically recorded by the MLS system representing the date/time the listing was last modified. |
| LotSizeAcres | Decimal | The total Acres of the lot. |
| LotSizeSquareFeet | Decimal | The total square footage of the lot. |
| PreviousListPrice | Decimal | The most recent previous ListPrice of the listing. |
| SubdivisionName | String | A neighborhood, community, complex or builder tract. |
