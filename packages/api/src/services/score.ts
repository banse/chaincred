import type { WalletScore } from '@chaincred/common';
import { getDb } from '@chaincred/common';
import { calculateScore } from '@chaincred/scoring';
import { createPublicClient, http, type Address } from 'viem';
import { mainnet } from 'viem/chains';
import { getWalletActivity } from './activity.js';
import { resolveEns } from './ens.js';
import { EtherscanClient } from './etherscan.js';

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

  // Etherscan enrichment: verified source + internal tx count (fail-open)
  const etherscanKey = process.env.ETHERSCAN_API_KEY;
  if (etherscanKey) {
    try {
      const client = new EtherscanClient(etherscanKey);
      // Verified deployments: check Ethereum mainnet for deployed contracts
      if (activity.contractsDeployed > 0) {
        const verified = await client.isVerifiedContract(address, 1);
        if (verified) activity.verifiedDeployments = (activity.verifiedDeployments || 0) + 1;
      }
      // Internal transaction count from Ethereum mainnet
      const internalCount = await client.getInternalTxCount(address, 1);
      if (internalCount > 0) activity.internalTransactions = internalCount;
    } catch {
      // Fail-open: skip enrichment on any error
    }
  }

  const result = calculateScore(activity);

  // PRD 13.6 — If appeal is pending, floor sybilMultiplier at 0.5 (frozen, not zeroed)
  const appeal = await getAppealStatus(address);
  if (appeal?.status === 'pending') {
    result.sybilMultiplier = Math.max(result.sybilMultiplier, 0.5);
    result.totalScore = Math.round(result.rawScore * result.sybilMultiplier);
  }

  // ENS name resolution (fail-open)
  const ensName = await resolveEns(address).catch(() => null);
  return { ...result, ensName: ensName ?? undefined };
}

/** Check appeal status for an address. Returns null if no appeal exists. */
async function getAppealStatus(address: string): Promise<{ status: string } | null> {
  try {
    const sql = getDb();
    const [row] = await sql`
      SELECT status FROM appeals WHERE address = ${address.toLowerCase()} ORDER BY created_at DESC LIMIT 1
    `;
    return row ? { status: row.status as string } : null;
  } catch {
    return null;
  }
}
