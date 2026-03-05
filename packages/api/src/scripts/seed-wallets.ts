/**
 * Seed script for E2E testing.
 * Inserts 15 realistic wallet profiles into wallet_activity + events tables.
 * Idempotent via ON CONFLICT ... DO UPDATE.
 *
 * Usage: bun run packages/api/src/scripts/seed-wallets.ts
 */
import { getDb } from '@chaincred/common';

const sql = getDb();

interface WalletSeed {
  address: string;
  first_tx_timestamp: number;
  total_transactions: number;
  contracts_deployed: number;
  deployment_chains: string[];
  deployment_calldata_bytes: number;
  unique_protocols: string[];
  chains_active: string[];
  governance_votes: number;
  daos_participated: string[];
  proposals_created: number;
  delegation_events: number;
  bear_market_txs: number;
  active_month_set: string[];
  protocol_categories: string[];
  failed_transactions: number;
  total_calldata_bytes: number;
  recipient_addresses: string[];
  chain_protocol_pairs: string[];
  gas_price_set: string[];
  tx_hour_set: string[];
  create2_deployments: number;
  bear_market_periods: string[];
  execution_events: number;
  governance_chains: string[];
  permit_interactions: number;
  flashloan_transactions: number;
  smart_wallet_interactions: number;
  erc4337_operations: number;
  early_adoptions: number;
  independent_votes: number;
  earliest_deployment_timestamp: number;
  safe_executions: number;
  verified_deployments: number;
  reasoned_votes: number;
  mev_interactions: number;
  internal_transactions: number;
  contract_external_users: number;
  active_contracts: number;
  ens_name?: string;
}

/** Generate an array of YYYY-MM strings spread over years */
function months(startYear: number, count: number): string[] {
  const result: string[] = [];
  let y = startYear;
  let m = 1;
  for (let i = 0; i < count; i++) {
    result.push(`${y}-${String(m).padStart(2, '0')}`);
    m += Math.ceil(12 / Math.min(count, 12));
    if (m > 12) { m = (m % 12) || 1; y++; }
  }
  return result;
}

/** Generate N distinct hours */
function hours(count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count && i < 24; i++) {
    result.push(String(i));
  }
  return result;
}

/** Generate N distinct gas prices */
function gasPrices(count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(String(10 + i * 5));
  }
  return result;
}

/** Generate unique recipient addresses */
function recipients(count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(`0x${(i + 1).toString(16).padStart(40, '0')}`);
  }
  return result;
}

// ── Wallet profiles (use `bun run index-wallet <address>` for real data) ──

const wallets: WalletSeed[] = [];

// ── Event types for timeline coverage ──

interface EventSeed {
  chain_id: number;
  block_number: number;
  tx_hash: string;
  from_address: string;
  to_address: string;
  type: string;
  protocol: string | null;
  timestamp: number;
}

function generateEvents(w: WalletSeed): EventSeed[] {
  const events: EventSeed[] = [];
  const addr = w.address.toLowerCase();
  let blockNum = 15000000;
  let ts = w.first_tx_timestamp;

  // Generic swap event
  if (w.unique_protocols.length > 0) {
    events.push({
      chain_id: 1,
      block_number: blockNum++,
      tx_hash: `0x${addr.slice(2, 10)}${'a'.repeat(56)}`,
      from_address: addr,
      to_address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      type: 'swap',
      protocol: w.unique_protocols[0],
      timestamp: ts + 1000,
    });
  }

  // Governance vote event
  if (w.governance_votes > 0) {
    events.push({
      chain_id: 1,
      block_number: blockNum++,
      tx_hash: `0x${addr.slice(2, 10)}${'b'.repeat(56)}`,
      from_address: addr,
      to_address: '0x323A76393544d5ecca80cd6ef2A560C6a395b7E3',
      type: 'vote',
      protocol: null,
      timestamp: ts + 100000,
    });
  }

  // Contract deployment event
  if (w.contracts_deployed > 0) {
    events.push({
      chain_id: 1,
      block_number: blockNum++,
      tx_hash: `0x${addr.slice(2, 10)}${'c'.repeat(56)}`,
      from_address: addr,
      to_address: '',
      type: 'deploy',
      protocol: null,
      timestamp: ts + 200000,
    });
  }

  // Delegation event
  if (w.delegation_events > 0) {
    events.push({
      chain_id: 1,
      block_number: blockNum++,
      tx_hash: `0x${addr.slice(2, 10)}${'d'.repeat(56)}`,
      from_address: addr,
      to_address: '0x323A76393544d5ecca80cd6ef2A560C6a395b7E3',
      type: 'delegate',
      protocol: null,
      timestamp: ts + 300000,
    });
  }

  // Safe execution event
  if (w.safe_executions > 0) {
    events.push({
      chain_id: 1,
      block_number: blockNum++,
      tx_hash: `0x${addr.slice(2, 10)}${'e'.repeat(56)}`,
      from_address: addr,
      to_address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
      type: 'safe-exec',
      protocol: 'Safe',
      timestamp: ts + 400000,
    });
  }

  // Transfer event (generic activity)
  events.push({
    chain_id: 1,
    block_number: blockNum++,
    tx_hash: `0x${addr.slice(2, 10)}${'f'.repeat(56)}`,
    from_address: addr,
    to_address: '0x0000000000000000000000000000000000000001',
    type: 'transfer',
    protocol: null,
    timestamp: ts + 500000,
  });

  // Multi-chain event if active on L2
  if (w.chains_active.includes('arbitrum')) {
    events.push({
      chain_id: 42161,
      block_number: blockNum++,
      tx_hash: `0x${addr.slice(2, 10)}${'1'.repeat(56)}`,
      from_address: addr,
      to_address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      type: 'swap',
      protocol: 'Uniswap',
      timestamp: ts + 600000,
    });
  }

  return events;
}

// ── Main seed function ──

async function seed() {
  console.log('Seeding 16 wallet profiles...');

  for (const w of wallets) {
    const addr = w.address.toLowerCase();

    await sql`
      INSERT INTO wallet_activity (
        address, first_tx_timestamp, total_transactions, contracts_deployed,
        deployment_chains, deployment_calldata_bytes,
        unique_protocols, chains_active,
        governance_votes, daos_participated, proposals_created, delegation_events,
        bear_market_txs, active_month_set, protocol_categories,
        failed_transactions, total_calldata_bytes,
        recipient_addresses, chain_protocol_pairs, gas_price_set, tx_hour_set,
        create2_deployments, bear_market_periods,
        execution_events, governance_chains,
        permit_interactions, flashloan_transactions,
        smart_wallet_interactions, erc4337_operations,
        early_adoptions, independent_votes, earliest_deployment_timestamp,
        safe_executions, verified_deployments, reasoned_votes,
        mev_interactions, internal_transactions,
        contract_external_users, active_contracts,
        ens_name, updated_at
      ) VALUES (
        ${addr}, ${w.first_tx_timestamp}, ${w.total_transactions}, ${w.contracts_deployed},
        ${w.deployment_chains}, ${w.deployment_calldata_bytes},
        ${w.unique_protocols}, ${w.chains_active},
        ${w.governance_votes}, ${w.daos_participated}, ${w.proposals_created}, ${w.delegation_events},
        ${w.bear_market_txs}, ${w.active_month_set}, ${w.protocol_categories},
        ${w.failed_transactions}, ${w.total_calldata_bytes},
        ${w.recipient_addresses}, ${w.chain_protocol_pairs}, ${w.gas_price_set}, ${w.tx_hour_set},
        ${w.create2_deployments}, ${w.bear_market_periods},
        ${w.execution_events}, ${w.governance_chains},
        ${w.permit_interactions}, ${w.flashloan_transactions},
        ${w.smart_wallet_interactions}, ${w.erc4337_operations},
        ${w.early_adoptions}, ${w.independent_votes}, ${w.earliest_deployment_timestamp},
        ${w.safe_executions}, ${w.verified_deployments}, ${w.reasoned_votes},
        ${w.mev_interactions}, ${w.internal_transactions},
        ${w.contract_external_users}, ${w.active_contracts},
        ${w.ens_name ?? null}, ${Date.now()}
      )
      ON CONFLICT (address) DO UPDATE SET
        first_tx_timestamp = EXCLUDED.first_tx_timestamp,
        total_transactions = EXCLUDED.total_transactions,
        contracts_deployed = EXCLUDED.contracts_deployed,
        deployment_chains = EXCLUDED.deployment_chains,
        deployment_calldata_bytes = EXCLUDED.deployment_calldata_bytes,
        unique_protocols = EXCLUDED.unique_protocols,
        chains_active = EXCLUDED.chains_active,
        governance_votes = EXCLUDED.governance_votes,
        daos_participated = EXCLUDED.daos_participated,
        proposals_created = EXCLUDED.proposals_created,
        delegation_events = EXCLUDED.delegation_events,
        bear_market_txs = EXCLUDED.bear_market_txs,
        active_month_set = EXCLUDED.active_month_set,
        protocol_categories = EXCLUDED.protocol_categories,
        failed_transactions = EXCLUDED.failed_transactions,
        total_calldata_bytes = EXCLUDED.total_calldata_bytes,
        recipient_addresses = EXCLUDED.recipient_addresses,
        chain_protocol_pairs = EXCLUDED.chain_protocol_pairs,
        gas_price_set = EXCLUDED.gas_price_set,
        tx_hour_set = EXCLUDED.tx_hour_set,
        create2_deployments = EXCLUDED.create2_deployments,
        bear_market_periods = EXCLUDED.bear_market_periods,
        execution_events = EXCLUDED.execution_events,
        governance_chains = EXCLUDED.governance_chains,
        permit_interactions = EXCLUDED.permit_interactions,
        flashloan_transactions = EXCLUDED.flashloan_transactions,
        smart_wallet_interactions = EXCLUDED.smart_wallet_interactions,
        erc4337_operations = EXCLUDED.erc4337_operations,
        early_adoptions = EXCLUDED.early_adoptions,
        independent_votes = EXCLUDED.independent_votes,
        earliest_deployment_timestamp = EXCLUDED.earliest_deployment_timestamp,
        safe_executions = EXCLUDED.safe_executions,
        verified_deployments = EXCLUDED.verified_deployments,
        reasoned_votes = EXCLUDED.reasoned_votes,
        mev_interactions = EXCLUDED.mev_interactions,
        internal_transactions = EXCLUDED.internal_transactions,
        contract_external_users = EXCLUDED.contract_external_users,
        active_contracts = EXCLUDED.active_contracts,
        ens_name = EXCLUDED.ens_name,
        updated_at = EXCLUDED.updated_at
    `;

    // Insert events for timeline
    const events = generateEvents(w);
    for (const e of events) {
      await sql`
        INSERT INTO events (chain_id, block_number, tx_hash, from_address, to_address, type, protocol, timestamp)
        VALUES (${e.chain_id}, ${e.block_number}, ${e.tx_hash}, ${e.from_address}, ${e.to_address}, ${e.type}, ${e.protocol}, ${e.timestamp})
        ON CONFLICT DO NOTHING
      `;
    }

    console.log(`  Seeded ${addr.slice(0, 10)}... (${w.unique_protocols.length} protocols, ${w.governance_votes} votes)`);
  }

  console.log(`\nDone. ${wallets.length} wallets seeded.`);
  await sql.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
