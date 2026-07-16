import { query } from "../db.js";
import type { ListingRow, PropertyFilters } from "../types.js";

// Week 3
export async function searchActiveListings(filters: PropertyFilters, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT
      L_ListingID AS ListingKey, L_DisplayId,
      L_Address AS UnparsedAddress, L_City AS City, L_Zip AS PostalCode,
      L_SystemPrice AS ListPrice, L_Keyword2 AS BedroomsTotal, LM_Dec_3 AS BathroomsTotalInteger,
      LM_Int2_3 AS LivingArea, L_Type_ AS PropertySubType, L_Status AS MlsStatus,
      LMD_MP_Latitude AS Latitude, LMD_MP_Longitude AS Longitude,
      YearBuilt, AssociationFee, DaysOnMarket,
      PoolPrivateYN, ViewYN, FireplaceYN, PhotoCount AS PhotosCount,
      LA1_UserFirstName AS ListAgentFirstName, LA1_UserLastName AS ListAgentLastName,
      LO1_OrganizationName AS ListOfficeName
    FROM rets_property WHERE L_Status = "Active"
  `;
  const params: any[] = [];

  if (filters.city) { sql += " AND L_City = ?"; params.push(filters.city); }
  if (filters.maxPrice) { sql += " AND L_SystemPrice <= ?"; params.push(filters.maxPrice); }
  if (filters.beds) { sql += " AND L_Keyword2 >= ?"; params.push(filters.beds); }
  if (filters.baths) { sql += " AND LM_Dec_3 >= ?"; params.push(filters.baths); }
  if (filters.sqft) { sql += " AND LM_Int2_3 >= ?"; params.push(filters.sqft); }
  if (filters.type) { sql += " AND L_Type_ = ?"; params.push(filters.type); }
  if (filters.pool) { sql += " AND PoolPrivateYN = ?"; params.push(filters.pool); }
  if (filters.hasView) { sql += " AND ViewYN = ?"; params.push(filters.hasView); }
  if (filters.maxHoa) { sql += " AND AssociationFee <= ?"; params.push(filters.maxHoa); }

  sql += " ORDER BY L_SystemPrice ASC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  return query<ListingRow>(sql, params);
}
