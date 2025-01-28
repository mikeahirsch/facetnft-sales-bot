import { Injectable } from '@nestjs/common';

import { AbiEvent, parseAbiItem } from 'viem';

import { UtilService } from '@/services/util.service';

import { Market, MarketplaceEvent } from '@/models/evm';

import EventEmitter from 'events';
import { config } from 'dotenv';
import { viem as facetViem } from '@0xfacet/sdk';
import axios from 'axios';
config();

/**
 * Service for interacting with EVM-compatible blockchains
 */
@Injectable()
export class EvmService {

  private client = facetViem.createFacetPublicClient(1)

  constructor(private readonly utilSvc: UtilService) {}
  
  /**
   * Fetches historical sales events from a marketplace contract by querying logs in chunks
   * @param market The marketplace configuration containing the contract address
   * @param marketEvent The marketplace event configuration containing the event signature and parameters
   * @param blockRange Number of blocks to look back from current block, or object containing start and end blocks
   * @returns Array of event logs matching the event signature
   */
  async indexPreviousEvents(
    market: Market,
    marketEvent: MarketplaceEvent,
    blockRange: number | { startBlock: number; endBlock: number } = 100_000
  ) {
    let startBlock: bigint;
    let endBlock: bigint;

    if (typeof blockRange === 'number') {
      endBlock = await this.client.getBlockNumber();
      startBlock = endBlock - BigInt(blockRange);
    } else {
      startBlock = BigInt(blockRange.startBlock);
      endBlock = BigInt(blockRange.endBlock);
    }

    const CHUNK_SIZE = 10_000;
    const logs = [];

    // Query in chunks of CHUNK_SIZE blocks
    for (let fromBlock = startBlock; fromBlock < endBlock; fromBlock += BigInt(CHUNK_SIZE)) {
      const toBlock = fromBlock + BigInt(CHUNK_SIZE) > endBlock 
        ? endBlock 
        : fromBlock + BigInt(CHUNK_SIZE);
      
      const chunkLogs = await this.client.getLogs({
        address: market.address,
        // If there is an event trigger, use it, otherwise use the market event signature
        event: parseAbiItem(marketEvent.eventTrigger?.signature || marketEvent.signature) as AbiEvent,
        fromBlock,
        toBlock,
      });
      logs.push(...chunkLogs);
    }
    return logs;
  }

  /**
   * Sets up a subscription to watch for new events from a contract
   * @param market The marketplace configuration containing the contract address
   * @param marketEvent The marketplace event configuration containing the event signature and parameters to watch
   * @returns EventEmitter that emits 'event' when new matching logs occur, with cleanup handler to unsubscribe
   */
  watchEvent(market: Market, marketEvent: MarketplaceEvent): EventEmitter {
    const emitter = new EventEmitter();
    
    const unwatch = this.client.watchEvent({
      address: market.address,
      event: parseAbiItem(marketEvent.eventTrigger?.signature || marketEvent.signature) as AbiEvent,
      onLogs: logs => emitter.emit('event', logs)
    });

    emitter.on('cleanup', () => {
      unwatch();
      emitter.removeAllListeners();
    });

    return emitter;
  }

  /**
   * Retrieves the transaction receipt for a given transaction hash
   * @param transactionHash The hash of the transaction to look up
   * @returns The transaction receipt data
   */
  async getTransactionReceipt(transactionHash: `0x${string}`) {
    return await this.client.getTransactionReceipt({ hash: transactionHash });
  }
  
  /**
   * Retrieves the tokenURI for a given NFT contract and token ID
   * @param contractAddress The address of the NFT contract
   * @param tokenId The token ID for which the URI is to be fetched
   * @returns The token URI string, or null if not found or an error occurs
   */
  async getTokenURI(contractAddress: `0x${string}`, tokenId: bigint): Promise<string | null> {
    try {
      // Call the `tokenURI` method on the contract
      const tokenURI: string = await this.client.readContract({
        address: contractAddress,
        abi: [
          {
            type: 'function',
            name: 'tokenURI',
            inputs: [{ name: 'tokenId', type: 'uint256' }],
            outputs: [{ name: '', type: 'string' }],
            stateMutability: 'view',
          },
        ],
        functionName: 'tokenURI',
        args: [tokenId],
      });

      if (tokenURI.startsWith('data:application/json;base64,')) {
        // Decode Base64-encoded JSON metadata
        const base64Data = tokenURI.replace('data:application/json;base64,', '');
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
        return JSON.parse(jsonString);
      } else if (tokenURI.startsWith('ipfs://')) {
        // Convert IPFS URI to a public gateway URL
        const ipfsGatewayURL = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
        const response = await axios.get(ipfsGatewayURL, { responseType: 'json' });
        return response.data;
      } else if (tokenURI.startsWith('http://') || tokenURI.startsWith('https://')) {
        // Fetch JSON metadata from HTTP(S) URL
        const response = await axios.get(tokenURI, { responseType: 'json' });
        return response.data;
      } else {
        console.warn('Unsupported tokenURI format:', tokenURI);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching tokenURI for contract ${contractAddress} and tokenId ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Retrieves the ENS name for a given Ethereum address
   * @param address The Ethereum address to look up
   * @returns The ENS name for the address, or null if not found
   */
  async getEnsName(address: `0x${string}`): Promise<string | null> {
    try {
      return await this.client.getEnsName({ address });
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}
