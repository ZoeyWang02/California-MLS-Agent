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

// Field names follow the RETS-to-RESO mapping (L_ListingID -> ListingKey,
// L_Address -> UnparsedAddress, L_Keyword2 -> BedroomsTotal, etc.) so
// active-listing rows and california_sold rows (SoldRow) share one vocabulary.
export interface ListingRow {
  ListingKey: string;
  L_DisplayId: string;
  UnparsedAddress: string;
  City: string;
  PostalCode: string;
  ListPrice: number;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  LivingArea: number;
  PropertySubType: string;
  MlsStatus: string;
  Latitude: number;
  Longitude: number;
  YearBuilt: number;
  AssociationFee: number;
  DaysOnMarket: number;
  PoolPrivateYN: string;
  ViewYN: string;
  FireplaceYN: string;
  PhotosCount: number;
  ListAgentFirstName: string;
  ListAgentLastName: string;
  ListOfficeName: string;
}

// Week 4 conversational state: structured, deterministic slots the code
// checks directly (if (!session.maxPrice) ask for budget) - not OpenClaw's
// own conversational memory. Keyed by userId in the session store.
export interface UserSession extends PropertyFilters {
  lastResults?: ListingRow[];
  conversationStep: number;
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
