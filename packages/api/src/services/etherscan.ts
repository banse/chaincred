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

  /** Get contracts deployed by an address using txlistinternal with txtype=create. Returns contract addresses (max 10). */
  async getDeployedContracts(address: string, chainId: number): Promise<string[]> {
    if (!SUPPORTED_CHAIN_IDS.has(chainId)) return [];

    const cacheKey = `deployed:${chainId}:${address.toLowerCase()}`;
    const cached = getCached<string[]>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const url = `${ETHERSCAN_V2_URL}?chainid=${chainId}&module=account&action=txlistinternal&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${this.apiKey}`;
      const json = await throttledFetch(url);
      if (!Array.isArray(json?.result)) {
        setCache(cacheKey, []);
        return [];
      }
      // Filter for contract creation txs by this address
      const contracts = json.result
        .filter((tx: any) => tx.type === 'create' && tx.from?.toLowerCase() === address.toLowerCase() && tx.contractAddress)
        .map((tx: any) => tx.contractAddress.toLowerCase())
        .slice(0, 10);
      setCache(cacheKey, contracts);
      return contracts;
    } catch {
      return [];
    }
  }

  /** Analyze a deployed contract: count unique external callers (excl deployer) and check if active in last 6mo. */
  async analyzeContract(
    contractAddress: string,
    deployer: string,
    chainId: number,
  ): Promise<{ externalUsers: number; activeRecently: boolean }> {
    if (!SUPPORTED_CHAIN_IDS.has(chainId)) return { externalUsers: 0, activeRecently: false };

    const cacheKey = `analyze:${chainId}:${contractAddress.toLowerCase()}`;
    const cached = getCached<{ externalUsers: number; activeRecently: boolean }>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const url = `${ETHERSCAN_V2_URL}?chainid=${chainId}&module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&page=1&offset=10000&sort=desc&apikey=${this.apiKey}`;
      const json = await throttledFetch(url);
      if (!Array.isArray(json?.result)) {
        const empty = { externalUsers: 0, activeRecently: false };
        setCache(cacheKey, empty);
        return empty;
      }

      const sixMonthsAgo = Math.floor(Date.now() / 1000) - 180 * 86400;
      const uniqueCallers = new Set<string>();
      let activeRecently = false;

      for (const tx of json.result) {
        const from = tx.from?.toLowerCase();
        if (from && from !== deployer.toLowerCase()) {
          uniqueCallers.add(from);
        }
        if (!activeRecently && Number(tx.timeStamp) >= sixMonthsAgo) {
          activeRecently = true;
        }
      }

      const result = { externalUsers: uniqueCallers.size, activeRecently };
      setCache(cacheKey, result);
      return result;
    } catch {
      return { externalUsers: 0, activeRecently: false };
    }
  }

  /** Get the first incoming (funding) transaction for a wallet. Returns sender address + timestamp, or null. */
  async getFirstIncomingTx(
    address: string,
    chainId: number,
  ): Promise<{ from: string; timestamp: number } | null> {
    if (!SUPPORTED_CHAIN_IDS.has(chainId)) return null;

    const cacheKey = `firstin:${chainId}:${address.toLowerCase()}`;
    const cached = getCached<{ from: string; timestamp: number } | null>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const url = `${ETHERSCAN_V2_URL}?chainid=${chainId}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=asc&apikey=${this.apiKey}`;
      const json = await throttledFetch(url);
      if (!Array.isArray(json?.result)) {
        setCache(cacheKey, null);
        return null;
      }

      // Find first tx where this address is the receiver (incoming ETH/token)
      const incoming = json.result.find(
        (tx: any) => tx.to?.toLowerCase() === address.toLowerCase() && tx.from,
      );
      if (!incoming) {
        setCache(cacheKey, null);
        return null;
      }

      const result = { from: incoming.from.toLowerCase(), timestamp: Number(incoming.timeStamp) };
      setCache(cacheKey, result);
      return result;
    } catch {
      return null;
    }
  }

  /** Count unique outbound addresses from a given address. Used for funding source cluster detection. */
  async getOutboundAddressCount(address: string, chainId: number): Promise<number> {
    if (!SUPPORTED_CHAIN_IDS.has(chainId)) return 0;

    const cacheKey = `outbound:${chainId}:${address.toLowerCase()}`;
    const cached = getCached<number>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const url = `${ETHERSCAN_V2_URL}?chainid=${chainId}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${this.apiKey}`;
      const json = await throttledFetch(url);
      if (!Array.isArray(json?.result)) {
        setCache(cacheKey, 0);
        return 0;
      }

      const uniqueRecipients = new Set<string>();
      for (const tx of json.result) {
        if (tx.from?.toLowerCase() === address.toLowerCase() && tx.to) {
          uniqueRecipients.add(tx.to.toLowerCase());
        }
      }

      const count = uniqueRecipients.size;
      setCache(cacheKey, count);
      return count;
    } catch {
      return 0;
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
