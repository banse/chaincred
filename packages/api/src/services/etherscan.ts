/** PRD 4.2/4.6 — Etherscan V2 API client for verified source + internal tx enrichment */

const ETHERSCAN_V2_URL = 'https://api.etherscan.io/v2/api';

/** Chains supported by Etherscan V2 (zkSync 324 not supported) */
const SUPPORTED_CHAIN_IDS = new Set([1, 42161, 10, 8453, 137]);

/** Simple in-memory cache with 24hr TTL */
const cache = new Map<string, { value: any; expiry: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/** 240ms throttle to respect Etherscan rate limits */
let lastRequestTime = 0;
const THROTTLE_MS = 240;

async function throttledFetch(url: string): Promise<any> {
  const now = Date.now();
  const wait = THROTTLE_MS - (now - lastRequestTime);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestTime = Date.now();

  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json;
}

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function setCache(key: string, value: any): void {
  cache.set(key, { value, expiry: Date.now() + CACHE_TTL });
}

export class EtherscanClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** Check if a contract address has verified source code on Etherscan. Fail-open: returns false on error. */
  async isVerifiedContract(address: string, chainId: number): Promise<boolean> {
    if (!SUPPORTED_CHAIN_IDS.has(chainId)) return false;

    const cacheKey = `verified:${chainId}:${address.toLowerCase()}`;
    const cached = getCached<boolean>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const url = `${ETHERSCAN_V2_URL}?chainid=${chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${this.apiKey}`;
      const json = await throttledFetch(url);
      const result = json?.result?.[0];
      const verified = !!(result && result.SourceCode && result.SourceCode !== '');
      setCache(cacheKey, verified);
      return verified;
    } catch {
      return false;
    }
  }

  /** Get count of internal transactions for an address. Fail-open: returns 0 on error. */
  async getInternalTxCount(address: string, chainId: number): Promise<number> {
    if (!SUPPORTED_CHAIN_IDS.has(chainId)) return 0;

    const cacheKey = `internal:${chainId}:${address.toLowerCase()}`;
    const cached = getCached<number>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const url = `${ETHERSCAN_V2_URL}?chainid=${chainId}&module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${this.apiKey}`;
      const json = await throttledFetch(url);
      const count = Array.isArray(json?.result) ? json.result.length : 0;
      setCache(cacheKey, count);
      return count;
    } catch {
      return 0;
    }
  }
}
