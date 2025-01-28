import { Market } from '@/models/evm';

import * as signatures from '@/constants/signatures';

export const markets: Market[] = [
  {
    marketplaceName: 'Facet NFT',
    marketplaceUrl: 'https://facetnft.com',
    address: '0xC59DEC74518c6C86B90107C3644ac9dAcA149e70' as `0x${string}`,
    events: [
      {
        signature: signatures.facetPortSaleSignature,
        name: 'OfferAccepted',
        tokenIdTarget: 'assetId',
        valueTarget: 'considerationAmount',
        sellerTarget: 'seller',
        buyerTarget: 'recipient',
        collectionTarget: 'assetContract'
      }
    ]
  },
];

