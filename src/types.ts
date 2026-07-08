// Shared types for rets_property / california_sold access.
// Field names follow the Week 2 handbook filter table.

export interface PropertyFilters {
  city?: string;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  type?: string;
  pool?: string;
  hasView?: string;
  maxHoa?: number;
}

export interface ListingRow {
  L_ListingID: string;
  L_DisplayId: string;
  L_Address: string;
  L_City: string;
  L_Zip: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  status: string;
  lat: number;
  lng: number;
  YearBuilt: number;
  AssociationFee: number;
  DaysOnMarket: number;
  PoolPrivateYN: string;
  ViewYN: string;
  FireplaceYN: string;
  PhotoCount: number;
  LA1_UserFirstName: string;
  LA1_UserLastName: string;
  LO1_OrganizationName: string;
}

export interface SoldRow {
  ListingKey: number;
  UnparsedAddress: string;
  City: string;
  CloseDate: string;
  ClosePrice: number;
  OriginalListPrice: number;
  ListPrice: number;
  DaysOnMarket: number;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  LivingArea: number;
  PropertyType: string;
  PropertySubType: string;
  YearBuilt: number;
  ListAgentFullName: string;
  ListOfficeName: string;
  BuyerOfficeName: string;
}
