import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

/** Simple in-memory cache with 1-hour TTL */
const ensCache = new Map<string, { name: string | null; expiresAt: number }>();
const CACHE_TTL = 3600_000; // 1 hour
const ENS_TIMEOUT = 3_000; // 3s hard timeout

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.RPC_URL, { timeout: 3_000 }),
});

/** Resolve ENS name for an address. Fail-open: returns null on any error or timeout. */
export async function resolveEns(address: string): Promise<string | null> {
  const key = address.toLowerCase();
  const cached = ensCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.name;
  }

  try {
    const name = await Promise.race([
      client.getEnsName({ address: key as `0x${string}` }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ENS_TIMEOUT)),
    ]);
    ensCache.set(key, { name: name ?? null, expiresAt: Date.now() + CACHE_TTL });
    return name ?? null;
  } catch {
    ensCache.set(key, { name: null, expiresAt: Date.now() + CACHE_TTL });
    return null;
  }
}
