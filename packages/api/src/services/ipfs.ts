/** PRD 6.2 — IPFS score breakdown storage via Pinata */

import { createHash } from 'crypto';

const PINATA_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

/** 24hr in-memory cache: content hash → CID */
const cidCache = new Map<string, { cid: string; expires: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function contentHash(data: object): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

/**
 * Upload JSON to Pinata IPFS. Returns CID on success, empty string on failure (fail-open).
 * Caches by content hash for 24hrs to avoid duplicate uploads.
 */
export async function uploadJSON(data: object): Promise<string> {
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_API_SECRET;
  if (!apiKey || !apiSecret) return '';

  // Check cache
  const hash = contentHash(data);
  const cached = cidCache.get(hash);
  if (cached && cached.expires > Date.now()) return cached.cid;

  try {
    const res = await fetch(PINATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: { name: `chaincred-breakdown-${hash.slice(0, 12)}` },
      }),
    });

    if (!res.ok) return '';

    const body = (await res.json()) as { IpfsHash?: string };
    const cid = body.IpfsHash ?? '';

    if (cid) {
      cidCache.set(hash, { cid, expires: Date.now() + CACHE_TTL });
    }

    return cid;
  } catch {
    // Fail-open: scoring works without IPFS
    return '';
  }
}
