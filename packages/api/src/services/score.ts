import type { WalletScore } from '@chaincred/common';
import { calculateScore } from '@chaincred/scoring';
import { createPublicClient, http, type Address } from 'viem';
import { mainnet } from 'viem/chains';
import { getWalletActivity } from './activity.js';

const REGISTRY_ABI = [
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'excludedAddresses',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/** Check if address is excluded on the ChainCredRegistry contract. Fail-open on errors. */
async function isExcluded(address: string): Promise<boolean> {
  const registryAddress = process.env.CHAINCRED_REGISTRY_ADDRESS;
  if (!registryAddress) return false;

  try {
    const client = createPublicClient({
      chain: mainnet,
      transport: http(process.env.RPC_URL),
    });
    return await client.readContract({
      address: registryAddress as Address,
      abi: REGISTRY_ABI,
      functionName: 'excludedAddresses',
      args: [address as Address],
    });
  } catch {
    // Fail-open: if RPC is unreachable, don't block scoring
    return false;
  }
}

export async function getScore(address: string): Promise<WalletScore> {
  // PRD 13.7 — Exclusion registry integration
  if (await isExcluded(address)) {
    return {
      address,
      totalScore: 0,
      breakdown: {
        builder: { raw: 0, weighted: 0 },
        governance: { raw: 0, weighted: 0 },
        temporal: { raw: 0, weighted: 0 },
        protocolDiversity: { raw: 0, weighted: 0 },
        complexity: { raw: 0, weighted: 0 },
      },
      sybilMultiplier: 0,
      rawScore: 0,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  const activity = await getWalletActivity(address);
  if (!activity) throw new Error('Address not found');
  return calculateScore(activity);
}
