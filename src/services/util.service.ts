import { Injectable } from '@nestjs/common';
import _ from 'lodash';

@Injectable()
export class UtilService {

  /**
   * Formats a number into a human-readable currency string with K/M/B/T suffixes
   * @param n The number to format
   * @param decimals Number of decimal places (default 2)
   * @returns Formatted currency string
   */
  public formatCash(n: number, decimals = 2): string {
    if (n === 0) return '0';
    if (n < 1) return n.toFixed(2) + '';
    if (n < 1e3) return n.toFixed(decimals) + '';
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + 'K';
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + 'M';
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + 'B';
    if (n >= 1e12) return +(n / 1e12).toFixed(1) + 'T';
    return 0 + '';
  }

  /**
   * Extract a 32-byte hex string (0x followed by 64 hex chars) from a string if present
   * @param str - The string to search for a hex value
   * @returns The first matching 32-byte hex string found, or null if none found or input is undefined
   */
  public extractHex(str: string | undefined): `0x${string}` | null {
    if (!str) return null;
    const match = str.match(/0x[a-fA-F0-9]{64}/);
    return match ? (match[0] as `0x${string}`) : null;
  }

  /**
   * Parses a data URI into its mimetype and data components
   * @param dataURI The data URI string to parse
   * @returns Object containing mimetype, encoding (base64 or none), and data
   */
  public parseDataURI(dataURI: string): {
    mimetype: string;
    encoding: 'base64' | 'none';
    data: string;
  } | null {
    // Match the data URI pattern
    const match = dataURI.match(/^data:([^;,]+)?(?:;(base64))?,(.+)$/);

    if (!match) {
      return null;
    }

    return {
      mimetype: match[1] || '', // The mimetype (e.g., "image/png" or "image/svg+xml")
      encoding: match[2] === 'base64' ? 'base64' : 'none',
      data: match[3], // The actual content (base64 or raw)
    };
  }

  /**
   * Formats an address to a shortened string
   * @param address The address to format
   * @param length The number of characters to show on each side of the ellipsis
   * @returns The formatted address
   */
  formatAddress(address: string, length = 4) {
    address = address.toLowerCase();
    return `0x${address.slice(2, length + 2)}...${address.slice(-length)}`;
  }

  /**
   * Converts all keys in an object to camelCase recursively
   * @param obj The object to convert
   * @returns A new object with camelCase keys
   */
  public toCamelCase(obj: any): any {
    if (_.isArray(obj)) {
      return obj.map(this.toCamelCase.bind(this));
    } else if (_.isObject(obj)) {
      return _.mapValues(_.mapKeys(obj, (v, k) => _.camelCase(k)), this.toCamelCase.bind(this));
    } else {
      return obj;
    }
  }
}
