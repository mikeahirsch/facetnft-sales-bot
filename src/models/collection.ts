export interface AttributeCounts {
  [attribute: string]: { [trait: string]: string };
}

export interface CollectionStats {
  [key: string]: any;
}

export interface Collection {
  id: string;
  name: string;
  symbol: string;
  slug: string;
  assetType: string;
  assetContract: string;
  verified: boolean;
  featured: boolean;
  logoImageUri: string;
  bannerImageUri: string | null;
  backgroundColor: string | null;
  totalSupply: string;
  description: string;
  attributeCounts: AttributeCounts;
  twitterLink: string | null;
  discordLink: string | null;
  websiteLink: string | null;
  stats: CollectionStats;
  dailyVolume: string;
  allTimeVolume: string;
  dailySaleCount: string;
  allTimeSaleCount: string;
  uniqueHolderCount: string;
  numberListed: string;
  floorPrice: string;
  createdAt: string;
  updatedAt: string;
  rarityEnabled: boolean;
}

export interface TokenUri {
  name: string;
  image: string;
  attributes: Array<{
    value: string;
    traitType: string;
  }>;
  description: string;
}

export interface CollectionItem {
  id: string;
  assetContract: string;
  tokenUri: TokenUri;
  owner: string;
  assetId: string;
  assetType: string;
  compositeAssetId: string;
  name: string;
  description: string;
  externalUrl: string | null;
  backgroundColor: string | null;
  metadataLastRefreshedAt: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  rarityRank: string;
  rarityScore: string;
  offers: any[]; // Define structure if offers data is known
  highestBid: any | null; // Define structure if highestBid data is known
  lowestListing: any | null; // Define structure if lowestListing data is known
}

