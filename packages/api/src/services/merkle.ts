import { getDb } from '@chaincred/common';
import type { WalletActivity } from '@chaincred/common';
import { calculateScore } from '@chaincred/scoring';
import {
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  type Address,
  type Hex,
} from 'viem';

export interface MerkleLeaf {
  address: Address;
  score: number;
  hash: Hex;
}

export interface MerkleTree {
  root: Hex;
  leaves: MerkleLeaf[];
  proofs: Map<string, Hex[]>;
}

/** Match OpenZeppelin's double-hash leaf encoding used in ScoreMerkleRoot.sol:
 *  leaf = keccak256(bytes.concat(keccak256(abi.encode(account, score))))
 */
function hashLeaf(address: Address, score: bigint): Hex {
  const inner = keccak256(
    encodeAbiParameters(parseAbiParameters('address, uint256'), [address, score]),
  );
  return keccak256(`0x${inner.slice(2)}` as Hex);
}

function hashPair(a: Hex, b: Hex): Hex {
  // Sort pair for deterministic tree (same as OZ MerkleProof)
  const [left, right] = a < b ? [a, b] : [b, a];
  return keccak256(`0x${left.slice(2)}${right.slice(2)}` as Hex);
}

function buildTree(hashes: Hex[]): { layers: Hex[][]; root: Hex } {
  if (hashes.length === 0) {
    return { layers: [[]], root: '0x0000000000000000000000000000000000000000000000000000000000000000' };
  }

  // Sort leaves for deterministic ordering
  const sorted = [...hashes].sort();
  const layers: Hex[][] = [sorted];

  let current = sorted;
  while (current.length > 1) {
    const next: Hex[] = [];
    for (let i = 0; i < current.length; i += 2) {
      if (i + 1 < current.length) {
        next.push(hashPair(current[i], current[i + 1]));
      } else {
        // Odd node — promote it
        next.push(current[i]);
      }
    }
    layers.push(next);
    current = next;
  }

  return { layers, root: current[0] };
}

function generateProof(layers: Hex[][], leafIndex: number): Hex[] {
  const proof: Hex[] = [];
  let idx = leafIndex;

  for (let i = 0; i < layers.length - 1; i++) {
    const layer = layers[i];
    const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
    if (siblingIdx < layer.length) {
      proof.push(layer[siblingIdx]);
    }
    idx = Math.floor(idx / 2);
  }

  return proof;
}

/** Build a Merkle tree from all scored wallets in the database. */
export async function buildMerkleTree(): Promise<MerkleTree> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM wallet_activity`;

  const leaves: MerkleLeaf[] = [];

  for (const row of rows) {
    const activity: WalletActivity = {
      address: row.address,
      firstTxTimestamp: Number(row.first_tx_timestamp),
      totalTransactions: Number(row.total_transactions),
      contractsDeployed: Number(row.contracts_deployed),
      deploymentChains: row.deployment_chains ?? [],
      deploymentCalldataBytes: Number(row.deployment_calldata_bytes ?? 0),
      uniqueProtocols: row.unique_protocols ?? [],
      chainsActive: row.chains_active ?? [],
      governanceVotes: Number(row.governance_votes),
      daosParticipated: row.daos_participated ?? [],
      proposalsCreated: Number(row.proposals_created ?? 0),
      delegationEvents: Number(row.delegation_events ?? 0),
      bearMarketTxs: Number(row.bear_market_txs ?? 0),
      activeMonths: (row.active_month_set ?? []).length,
      protocolCategories: row.protocol_categories ?? [],
      failedTransactions: Number(row.failed_transactions ?? 0),
      totalCalldataBytes: Number(row.total_calldata_bytes ?? 0),
      uniqueRecipients: (row.recipient_addresses ?? []).length,
      chainProtocolPairs: row.chain_protocol_pairs ?? [],
      distinctGasPrices: (row.gas_price_set ?? []).length,
      distinctTxHours: (row.tx_hour_set ?? []).length,
      create2Deployments: Number(row.create2_deployments ?? 0),
      bearMarketPeriodsActive: (row.bear_market_periods ?? []).length,
      executionEvents: Number(row.execution_events ?? 0),
      governanceChains: row.governance_chains ?? [],
      permitInteractions: Number(row.permit_interactions ?? 0),
      flashloanTransactions: Number(row.flashloan_transactions ?? 0),
      smartWalletInteractions: Number(row.smart_wallet_interactions ?? 0),
      erc4337Operations: Number(row.erc4337_operations ?? 0),
      earlyAdoptions: Number(row.early_adoptions ?? 0),
      independentVotes: Number(row.independent_votes ?? 0),
      earliestDeploymentTimestamp: Number(row.earliest_deployment_timestamp ?? 0),
      safeExecutions: Number(row.safe_executions ?? 0),
      verifiedDeployments: Number(row.verified_deployments ?? 0),
      reasonedVotes: Number(row.reasoned_votes ?? 0),
      mevInteractions: Number(row.mev_interactions ?? 0),
      internalTransactions: Number(row.internal_transactions ?? 0),
      contractExternalUsers: Number(row.contract_external_users ?? 0),
      activeContracts: Number(row.active_contracts ?? 0),
      fundingSource: '',
      fundingSourceOutboundCount: 0,
      fundedByCex: false,
    };

    const { totalScore } = calculateScore(activity);
    const address = row.address as Address;
    const hash = hashLeaf(address, BigInt(totalScore));
    leaves.push({ address, score: totalScore, hash });
  }

  const hashes = leaves.map((l) => l.hash);
  const { layers, root } = buildTree(hashes);

  // Build index from hash → sorted position for proof generation
  const sorted = [...hashes].sort();
  const hashToIndex = new Map(sorted.map((h, i) => [h, i]));

  const proofs = new Map<string, Hex[]>();
  for (const leaf of leaves) {
    const idx = hashToIndex.get(leaf.hash)!;
    proofs.set(leaf.address.toLowerCase(), generateProof(layers, idx));
  }

  // Upsert wallet_scores for leaderboard optimization
  const now = Date.now();
  for (const leaf of leaves) {
    await sql`
      INSERT INTO wallet_scores (address, total_score, computed_at)
      VALUES (${leaf.address.toLowerCase()}, ${leaf.score}, ${now})
      ON CONFLICT (address) DO UPDATE SET total_score = ${leaf.score}, computed_at = ${now}
    `.catch(() => {}); // Fail-open if table doesn't exist yet
  }

  return { root, leaves, proofs };
}

/** Store Merkle proofs in the database for API access. */
export async function storeMerkleProofs(tree: MerkleTree): Promise<void> {
  const sql = getDb();

  // Create proofs table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS merkle_proofs (
      address TEXT PRIMARY KEY,
      score INTEGER NOT NULL,
      proof TEXT[] NOT NULL,
      root TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `;

  // Truncate and re-insert
  await sql`TRUNCATE merkle_proofs`;

  const now = Date.now();
  for (const leaf of tree.leaves) {
    const proof = tree.proofs.get(leaf.address.toLowerCase()) ?? [];
    await sql`
      INSERT INTO merkle_proofs (address, score, proof, root, created_at)
      VALUES (${leaf.address.toLowerCase()}, ${leaf.score}, ${sql.array(proof)}, ${tree.root}, ${now})
    `;
  }
}
