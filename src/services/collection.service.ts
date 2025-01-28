import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

import { UtilService } from '@/services/util.service';

import { collections } from '@/constants/collections';

import { Collection, CollectionItem } from '@/models/collection';

/**
 * Service for managing NFT collection data and metadata
 */
@Injectable()
export class CollectionService implements OnModuleInit {
  
  /**
   * In-memory cache mapping of collection metadata
   * Key format: collection:<contract_address>
   */
  memoryCache: Map<string, Collection> = new Map();

  constructor(private readonly utilSvc: UtilService) {}

  /**
   * Loads supported collection data when service initializes
   */
  async onModuleInit() {
    await this.loadSupportedCollections();
  }

  /**
   * Looks up collection metadata for a given contract address
   * 
   * @param contractAddress - The contract address to look up
   * @returns Collection metadata object
   */
  getCollection(contractAddress: string): Collection | undefined {
    if (!contractAddress) return;
  
    const cacheKey = `collection:${contractAddress.toLowerCase()}`;
    
    return this.memoryCache.get(cacheKey);
  }
  
  /**
   * Fetches metadata for a specific token in a collection
   * @param contractAddress - The contract address of the collection
   * @param tokenId - The ID of the token to fetch
   * @returns Token metadata object
   */
  async getToken(contractAddress: string, tokenId: string) {
    try {
      const response = await fetch(
        `https://api.facetswap.com/collection_items/${contractAddress.toLowerCase()}/${tokenId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch token metadata for contract ${contractAddress} and token ID ${tokenId}`
        );
      }

      const res = await response.json();

      // Convert response keys to camelCase
      return this.utilSvc.toCamelCase(res.result) as CollectionItem;
    } catch (error) {
      Logger.error(
        `Error fetching token metadata for contract ${contractAddress} and token ID ${tokenId}: ${error}`,
        'CollectionService'
      );
      throw error;
    }
  }

  /**
   * Loads and caches metadata for all configured collections
   * @throws Error if collection data cannot be fetched or parsed
   */
  async loadSupportedCollections() {
    try {
      for (const collection of collections) {
        const response = await fetch(`https://api.facetswap.com/collections/${collection}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch collection: ${collection}`);
        }
        
        const { result } = await response.json() as { result: Collection };
        
        const cacheKey = `collection:${collection.toLowerCase()}`;
        this.memoryCache.set(cacheKey, this.utilSvc.toCamelCase(result));

        Logger.log(`Loaded ${result.name} collection`, 'CollectionService');
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
      throw error;
    }
  }
}
