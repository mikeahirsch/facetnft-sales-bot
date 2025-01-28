import { Injectable, OnModuleInit } from '@nestjs/common';

import { config } from 'dotenv';
config();

/**
 * Service for fetching data from the third party APIs
 */
@Injectable()
export class DataService implements OnModuleInit {

  /** Current ETH/USD price */
  public usdPrice = 0;

  async onModuleInit() {
    // Fetch USD price every 10 minutes
    this.fetchUSDPrice().then(price => {
      this.usdPrice = price;
      setInterval(async () => {
        this.usdPrice = await this.fetchUSDPrice();
      }, 1000 * 60 * 10);
    });
  }

  /**
   * Fetches current ETH/USD price from CoinGecko API
   * @returns Current ETH price in USD
   */
  async fetchUSDPrice(): Promise<number> {
    const url = `https://api.coingecko.com/api/v3/simple/price`;

    const params = new URLSearchParams({
      ids: 'ethereum',
      vs_currencies: 'usd',
    });

    try {
      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.ethereum.usd;
    } catch (error) {
      console.log(error);
      return 0;
    }
  }
}
