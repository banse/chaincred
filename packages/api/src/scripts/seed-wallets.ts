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

// ── 15 wallet profiles ──

const wallets: WalletSeed[] = [
  // 1. OG builder (vitalik.eth)
  {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    ens_name: 'vitalik.eth',
    first_tx_timestamp: 1438269973, // July 2015
    total_transactions: 2500,
    contracts_deployed: 12,
    deployment_chains: ['ethereum', 'arbitrum', 'optimism', 'base', 'zksync', 'polygon'],
    deployment_calldata_bytes: 85000,
    unique_protocols: [
      'Uniswap', 'Aave', 'Compound', 'Lido', 'Curve', '1inch',
      'SushiSwap', 'Balancer', 'MakerDAO', 'ENS', 'Safe', 'Chainlink',
      'The Graph', 'Lens', 'Farcaster',
    ],
    chains_active: ['ethereum', 'arbitrum', 'optimism', 'base', 'zksync', 'polygon'],
    governance_votes: 30,
    daos_participated: ['ENS', 'Uniswap', 'Aave', 'Compound', 'Gitcoin', 'Nouns'],
    proposals_created: 4,
    delegation_events: 8,
    bear_market_txs: 120,
    active_month_set: months(2015, 48),
    protocol_categories: ['defi', 'governance', 'infrastructure', 'social', 'gaming', 'builder-tools'],
    failed_transactions: 45,
    total_calldata_bytes: 520000,
    recipient_addresses: recipients(80),
    chain_protocol_pairs: [
      'ethereum:Uniswap', 'ethereum:Aave', 'ethereum:Compound', 'ethereum:Lido',
      'ethereum:ENS', 'ethereum:MakerDAO', 'arbitrum:Aave', 'arbitrum:GMX',
      'optimism:Uniswap', 'base:Uniswap', 'polygon:Aave', 'zksync:SushiSwap',
    ],
    gas_price_set: gasPrices(30),
    tx_hour_set: hours(18),
    create2_deployments: 3,
    bear_market_periods: ['Nov 2018 – Mar 2019', 'May 2021 – Nov 2021', 'Nov 2022 – Jan 2023'],
    execution_events: 5,
    governance_chains: ['ethereum', 'arbitrum', 'optimism'],
    permit_interactions: 8,
    flashloan_transactions: 2,
    smart_wallet_interactions: 3,
    erc4337_operations: 2,
    early_adoptions: 5,
    independent_votes: 8,
    earliest_deployment_timestamp: 1500000000,
    safe_executions: 4,
    verified_deployments: 6,
    reasoned_votes: 10,
    mev_interactions: 0,
    internal_transactions: 150,
    contract_external_users: 45,
    active_contracts: 8,
  },

  // 2. DeFi builder (hayden.eth)
  {
    address: '0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa',
    ens_name: 'hayden.eth',
    first_tx_timestamp: 1534000000, // Aug 2018
    total_transactions: 1800,
    contracts_deployed: 8,
    deployment_chains: ['ethereum', 'arbitrum', 'optimism', 'polygon'],
    deployment_calldata_bytes: 120000,
    unique_protocols: [
      'Uniswap', 'Aave', 'Compound', 'Curve', '1inch',
      'SushiSwap', 'Balancer', 'MakerDAO', 'Lido',
    ],
    chains_active: ['ethereum', 'arbitrum', 'optimism', 'polygon'],
    governance_votes: 12,
    daos_participated: ['Uniswap', 'Compound', 'ENS'],
    proposals_created: 2,
    delegation_events: 3,
    bear_market_txs: 60,
    active_month_set: months(2018, 40),
    protocol_categories: ['defi', 'governance', 'infrastructure'],
    failed_transactions: 30,
    total_calldata_bytes: 380000,
    recipient_addresses: recipients(50),
    chain_protocol_pairs: [
      'ethereum:Uniswap', 'ethereum:Compound', 'ethereum:Curve',
      'arbitrum:Uniswap', 'optimism:Uniswap', 'polygon:Aave',
    ],
    gas_price_set: gasPrices(25),
    tx_hour_set: hours(16),
    create2_deployments: 4,
    bear_market_periods: ['Nov 2018 – Mar 2019', 'Nov 2022 – Jan 2023'],
    execution_events: 2,
    governance_chains: ['ethereum'],
    permit_interactions: 15,
    flashloan_transactions: 5,
    smart_wallet_interactions: 2,
    erc4337_operations: 1,
    early_adoptions: 3,
    independent_votes: 3,
    earliest_deployment_timestamp: 1540000000,
    safe_executions: 1,
    verified_deployments: 3,
    reasoned_votes: 4,
    mev_interactions: 0,
    internal_transactions: 80,
    contract_external_users: 30,
    active_contracts: 5,
  },

  // 3. Governor (brantly.eth)
  {
    address: '0xd26a3F686D43f2A62BA9eaE2ff77e9f516d945B9',
    ens_name: 'brantly.eth',
    first_tx_timestamp: 1580000000, // Jan 2020
    total_transactions: 900,
    contracts_deployed: 1,
    deployment_chains: ['ethereum'],
    deployment_calldata_bytes: 5000,
    unique_protocols: ['Uniswap', 'Aave', 'ENS', 'Safe', 'Compound', 'MakerDAO'],
    chains_active: ['ethereum', 'arbitrum', 'optimism'],
    governance_votes: 25,
    daos_participated: ['ENS', 'Uniswap', 'Aave', 'Compound', 'Gitcoin'],
    proposals_created: 3,
    delegation_events: 5,
    bear_market_txs: 30,
    active_month_set: months(2020, 30),
    protocol_categories: ['defi', 'governance', 'infrastructure'],
    failed_transactions: 15,
    total_calldata_bytes: 90000,
    recipient_addresses: recipients(30),
    chain_protocol_pairs: [
      'ethereum:ENS', 'ethereum:Uniswap', 'ethereum:Aave',
      'ethereum:Compound', 'arbitrum:Aave',
    ],
    gas_price_set: gasPrices(20),
    tx_hour_set: hours(14),
    create2_deployments: 0,
    bear_market_periods: ['Nov 2022 – Jan 2023'],
    execution_events: 3,
    governance_chains: ['ethereum', 'arbitrum'],
    permit_interactions: 4,
    flashloan_transactions: 0,
    smart_wallet_interactions: 1,
    erc4337_operations: 0,
    early_adoptions: 1,
    independent_votes: 6,
    earliest_deployment_timestamp: 1600000000,
    safe_executions: 3,
    verified_deployments: 0,
    reasoned_votes: 4,
    mev_interactions: 0,
    internal_transactions: 20,
    contract_external_users: 2,
    active_contracts: 0,
  },

  // 4. Governance whale
  {
    address: '0x76e222b07C53D28b89b0bAc18602810Fc22B4930',
    first_tx_timestamp: 1550000000, // Feb 2019
    total_transactions: 1200,
    contracts_deployed: 0,
    deployment_chains: [],
    deployment_calldata_bytes: 0,
    unique_protocols: ['Uniswap', 'Aave', 'Compound', 'ENS', 'Safe', 'MakerDAO', 'Lido', 'Curve'],
    chains_active: ['ethereum', 'arbitrum', 'optimism'],
    governance_votes: 50,
    daos_participated: ['ENS', 'Uniswap', 'Aave', 'Compound', 'Gitcoin', 'MakerDAO', 'Nouns', 'Safe'],
    proposals_created: 5,
    delegation_events: 8,
    bear_market_txs: 50,
    active_month_set: months(2019, 36),
    protocol_categories: ['defi', 'governance', 'infrastructure'],
    failed_transactions: 20,
    total_calldata_bytes: 150000,
    recipient_addresses: recipients(40),
    chain_protocol_pairs: [
      'ethereum:Uniswap', 'ethereum:Aave', 'ethereum:Compound',
      'ethereum:ENS', 'ethereum:MakerDAO', 'arbitrum:Aave',
      'optimism:Uniswap',
    ],
    gas_price_set: gasPrices(25),
    tx_hour_set: hours(15),
    create2_deployments: 0,
    bear_market_periods: ['May 2021 – Nov 2021', 'Nov 2022 – Jan 2023'],
    execution_events: 4,
    governance_chains: ['ethereum', 'arbitrum', 'optimism'],
    permit_interactions: 6,
    flashloan_transactions: 0,
    smart_wallet_interactions: 2,
    erc4337_operations: 0,
    early_adoptions: 2,
    independent_votes: 12,
    earliest_deployment_timestamp: 0,
    safe_executions: 5,
    verified_deployments: 0,
    reasoned_votes: 6,
    mev_interactions: 0,
    internal_transactions: 30,
    contract_external_users: 0,
    active_contracts: 0,
  },

  // 5. OG contributor (timbeiko.eth)
  {
    address: '0xDBF5E9c5206d0dB70a90108bf936DA60221dC080',
    ens_name: 'timbeiko.eth',
    first_tx_timestamp: 1420070400, // Jan 2015
    total_transactions: 1500,
    contracts_deployed: 2,
    deployment_chains: ['ethereum'],
    deployment_calldata_bytes: 8000,
    unique_protocols: [
      'Uniswap', 'Aave', 'Compound', 'Lido', 'Curve', 'ENS',
      'MakerDAO', 'Safe', 'Chainlink', 'The Graph',
    ],
    chains_active: ['ethereum', 'arbitrum', 'optimism'],
    governance_votes: 20,
    daos_participated: [
      'ENS', 'Uniswap', 'Aave', 'Compound', 'Gitcoin',
      'MakerDAO', 'Nouns', 'Safe', 'Lido', 'Hop',
    ],
    proposals_created: 2,
    delegation_events: 6,
    bear_market_txs: 90,
    active_month_set: months(2015, 42),
    protocol_categories: ['defi', 'governance', 'infrastructure', 'social'],
    failed_transactions: 35,
    total_calldata_bytes: 200000,
    recipient_addresses: recipients(60),
    chain_protocol_pairs: [
      'ethereum:Uniswap', 'ethereum:Aave', 'ethereum:Compound',
      'ethereum:ENS', 'ethereum:MakerDAO', 'ethereum:Lido',
      'arbitrum:Aave',
    ],
    gas_price_set: gasPrices(28),
    tx_hour_set: hours(16),
    create2_deployments: 0,
    bear_market_periods: ['Nov 2018 – Mar 2019', 'May 2021 – Nov 2021', 'Nov 2022 – Jan 2023'],
    execution_events: 2,
    governance_chains: ['ethereum'],
    permit_interactions: 5,
    flashloan_transactions: 0,
    smart_wallet_interactions: 1,
    erc4337_operations: 0,
    early_adoptions: 4,
    independent_votes: 5,
    earliest_deployment_timestamp: 1500000000,
    safe_executions: 2,
    verified_deployments: 1,
    reasoned_votes: 3,
    mev_interactions: 0,
    internal_transactions: 40,
    contract_external_users: 5,
    active_contracts: 1,
  },

  // 6. Builder+governor (nick.eth)
  {
    address: '0xa1E4380A3B1f749673E270229993eE55F35663b4',
    ens_name: 'nick.eth',
    first_tx_timestamp: 1495000000, // May 2017
    total_transactions: 1100,
    contracts_deployed: 6,
    deployment_chains: ['ethereum', 'arbitrum', 'optimism', 'base'],
    deployment_calldata_bytes: 50000,
    unique_protocols: ['Uniswap', 'Aave', 'ENS', 'Safe', 'Compound', 'Chainlink', 'The Graph'],
    chains_active: ['ethereum', 'arbitrum', 'optimism', 'base'],
    governance_votes: 15,
    daos_participated: ['ENS', 'Uniswap', 'Aave', 'Compound'],
    proposals_created: 2,
    delegation_events: 4,
    bear_market_txs: 40,
    active_month_set: months(2017, 38),
    protocol_categories: ['defi', 'governance', 'infrastructure'],
    failed_transactions: 20,
    total_calldata_bytes: 180000,
    recipient_addresses: recipients(35),
    chain_protocol_pairs: [
      'ethereum:ENS', 'ethereum:Uniswap', 'ethereum:Aave',
      'arbitrum:Aave', 'optimism:Uniswap', 'base:Uniswap',
    ],
    gas_price_set: gasPrices(22),
    tx_hour_set: hours(15),
    create2_deployments: 2,
    bear_market_periods: ['Nov 2018 – Mar 2019', 'Nov 2022 – Jan 2023'],
    execution_events: 1,
    governance_chains: ['ethereum', 'arbitrum'],
    permit_interactions: 6,
    flashloan_transactions: 0,
    smart_wallet_interactions: 1,
    erc4337_operations: 0,
    early_adoptions: 2,
    independent_votes: 4,
    earliest_deployment_timestamp: 1500000000,
    safe_executions: 2,
    verified_deployments: 4,
    reasoned_votes: 3,
    mev_interactions: 0,
    internal_transactions: 60,
    contract_external_users: 20,
    active_contracts: 4,
  },

  // 7. Early adopter / explorer
  {
    address: '0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7',
    first_tx_timestamp: 1560000000, // Jun 2019
    total_transactions: 2000,
    contracts_deployed: 0,
    deployment_chains: [],
    deployment_calldata_bytes: 0,
    unique_protocols: [
      'Uniswap', 'Aave', 'Compound', 'Lido', 'Curve', '1inch',
      'SushiSwap', 'Balancer', 'MakerDAO', 'GMX', 'ENS', 'Lens',
      'Farcaster', 'Safe', 'Chainlink', 'The Graph', 'Treasure',
      'Aavegotchi', 'Deterministic Deployment Proxy', 'CREATE2 Factory',
    ],
    chains_active: ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon'],
    governance_votes: 8,
    daos_participated: ['ENS', 'Uniswap', 'Aave'],
    proposals_created: 0,
    delegation_events: 2,
    bear_market_txs: 45,
    active_month_set: months(2019, 35),
    protocol_categories: ['defi', 'governance', 'infrastructure', 'social', 'gaming', 'builder-tools'],
    failed_transactions: 40,
    total_calldata_bytes: 250000,
    recipient_addresses: recipients(70),
    chain_protocol_pairs: [
      'ethereum:Uniswap', 'ethereum:Aave', 'ethereum:Compound', 'ethereum:Lido',
      'ethereum:Curve', 'ethereum:ENS', 'ethereum:MakerDAO',
      'arbitrum:GMX', 'arbitrum:Aave', 'arbitrum:Treasure',
      'optimism:Uniswap', 'optimism:1inch',
      'base:Uniswap', 'base:Balancer',
      'polygon:Aave', 'polygon:Aavegotchi', 'polygon:SushiSwap',
    ],
    gas_price_set: gasPrices(24),
    tx_hour_set: hours(16),
    create2_deployments: 0,
    bear_market_periods: ['May 2021 – Nov 2021', 'Nov 2022 – Jan 2023'],
    execution_events: 0,
    governance_chains: ['ethereum'],
    permit_interactions: 10,
    flashloan_transactions: 1,
    smart_wallet_interactions: 3,
    erc4337_operations: 1,
    early_adoptions: 6,
    independent_votes: 2,
    earliest_deployment_timestamp: 0,
    safe_executions: 0,
    verified_deployments: 0,
    reasoned_votes: 1,
    mev_interactions: 0,
    internal_transactions: 35,
    contract_external_users: 0,
    active_contracts: 0,
  },

  // 8. Verified deployer
  {
    address: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
    first_tx_timestamp: 1500000000, // Jul 2017
    total_transactions: 800,
    contracts_deployed: 15,
    deployment_chains: ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon'],
    deployment_calldata_bytes: 200000,
    unique_protocols: ['Uniswap', 'Aave', 'ENS', 'Safe', 'Chainlink'],
    chains_active: ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon'],
    governance_votes: 5,
    daos_participated: ['ENS', 'Uniswap'],
    proposals_created: 0,
    delegation_events: 1,
    bear_market_txs: 20,
    active_month_set: months(2017, 30),
    protocol_categories: ['defi', 'infrastructure', 'builder-tools'],
    failed_transactions: 15,
    total_calldata_bytes: 450000,
    recipient_addresses: recipients(25),
    chain_protocol_pairs: [
      'ethereum:Uniswap', 'ethereum:ENS', 'ethereum:Safe',
      'arbitrum:Uniswap', 'optimism:Uniswap',
    ],
    gas_price_set: gasPrices(20),
    tx_hour_set: hours(14),
    create2_deployments: 6,
    bear_market_periods: ['Nov 2018 – Mar 2019'],
    execution_events: 0,
    governance_chains: ['ethereum'],
    permit_interactions: 3,
    flashloan_transactions: 0,
    smart_wallet_interactions: 0,
    erc4337_operations: 0,
    early_adoptions: 1,
    independent_votes: 1,
    earliest_deployment_timestamp: 1510000000,
    safe_executions: 0,
    verified_deployments: 5,
    reasoned_votes: 0,
    mev_interactions: 0,
    internal_transactions: 90,
    contract_external_users: 50,
    active_contracts: 10,
  },

  // 9. DeFi power user
  {
    address: '0x0c23fc0ef06716d2f8ba19bc4bed56d045581f2d',
    first_tx_timestamp: 1590000000, // May 2020
    total_transactions: 1500,
    contracts_deployed: 2,
    deployment_chains: ['ethereum'],
    deployment_calldata_bytes: 6000,
    unique_protocols: [
      'Uniswap', 'Aave', 'Compound', 'Lido', 'Curve', '1inch',
      'SushiSwap', 'Balancer', 'MakerDAO', 'GMX', 'ENS',
      'Safe', 'Chainlink', 'The Graph', 'Treasure',
    ],
    chains_active: ['ethereum', 'arbitrum', 'optimism', 'base', 'polygon'],
    governance_votes: 10,
    daos_participated: ['ENS', 'Uniswap', 'Aave'],
    proposals_created: 0,
    delegation_events: 2,
    bear_market_txs: 55,
    active_month_set: months(2020, 32),
    protocol_categories: ['defi', 'governance', 'infrastructure', 'gaming'],
    failed_transactions: 50,
    total_calldata_bytes: 600000,
    recipient_addresses: recipients(45),
    chain_protocol_pairs: [
      'ethereum:Uniswap', 'ethereum:Aave', 'ethereum:Compound',
      'ethereum:Curve', 'ethereum:MakerDAO', 'ethereum:1inch',
      'arbitrum:GMX', 'arbitrum:Aave',
      'optimism:Uniswap', 'base:Uniswap', 'polygon:Aave',
    ],
    gas_price_set: gasPrices(22),
    tx_hour_set: hours(15),
    create2_deployments: 0,
    bear_market_periods: ['May 2021 – Nov 2021', 'Nov 2022 – Jan 2023'],
    execution_events: 1,
    governance_chains: ['ethereum'],
    permit_interactions: 12,
    flashloan_transactions: 8,
    smart_wallet_interactions: 5,
    erc4337_operations: 3,
    early_adoptions: 2,
    independent_votes: 2,
    earliest_deployment_timestamp: 1600000000,
    safe_executions: 1,
    verified_deployments: 0,
    reasoned_votes: 2,
    mev_interactions: 0,
    internal_transactions: 120,
    contract_external_users: 3,
    active_contracts: 1,
  },

  // 10. L2-native multi-chain
  {
    address: '0x2ce21976443622ab8f0b7F6FA3aF953ff9071172',
    first_tx_timestamp: 1630000000, // Aug 2021
    total_transactions: 1000,
    contracts_deployed: 0,
    deployment_chains: [],
    deployment_calldata_bytes: 0,
    unique_protocols: [
      'Uniswap', 'Aave', 'Compound', 'Curve', '1inch',
      'SushiSwap', 'Balancer', 'GMX', 'ENS', 'Safe',
      'Chainlink', 'The Graph', 'Lido', 'Farcaster', 'Lens',
    ],
    chains_active: ['arbitrum', 'optimism', 'base', 'zksync', 'polygon'],
    governance_votes: 6,
    daos_participated: ['Uniswap', 'Aave'],
    proposals_created: 0,
    delegation_events: 1,
    bear_market_txs: 35,
    active_month_set: months(2021, 24),
    protocol_categories: ['defi', 'governance', 'infrastructure', 'social'],
    failed_transactions: 18,
    total_calldata_bytes: 120000,
    recipient_addresses: recipients(30),
    chain_protocol_pairs: [
      'arbitrum:Uniswap', 'arbitrum:GMX', 'arbitrum:Aave',
      'optimism:Uniswap', 'optimism:1inch',
      'base:Uniswap', 'base:Balancer',
      'zksync:SushiSwap', 'polygon:Aave', 'polygon:Curve',
    ],
    gas_price_set: gasPrices(18),
    tx_hour_set: hours(14),
    create2_deployments: 0,
    bear_market_periods: ['Nov 2022 – Jan 2023'],
    execution_events: 0,
    governance_chains: ['arbitrum'],
    permit_interactions: 5,
    flashloan_transactions: 1,
    smart_wallet_interactions: 2,
    erc4337_operations: 1,
    early_adoptions: 1,
    independent_votes: 1,
    earliest_deployment_timestamp: 0,
    safe_executions: 0,
    verified_deployments: 0,
    reasoned_votes: 1,
    mev_interactions: 0,
    internal_transactions: 15,
    contract_external_users: 0,
    active_contracts: 0,
  },

  // 11. Safe operator
  {
    address: '0x5B93FF82faaF241c15a0d9C8cA1c30CDe7c8e3b4',
    first_tx_timestamp: 1600000000, // Sep 2020
    total_transactions: 600,
    contracts_deployed: 0,
    deployment_chains: [],
    deployment_calldata_bytes: 0,
    unique_protocols: ['Uniswap', 'Aave', 'ENS', 'Safe', 'Compound'],
    chains_active: ['ethereum', 'arbitrum'],
    governance_votes: 12,
    daos_participated: ['ENS', 'Uniswap', 'Aave'],
    proposals_created: 1,
    delegation_events: 4,
    bear_market_txs: 20,
    active_month_set: months(2020, 22),
    protocol_categories: ['defi', 'governance'],
    failed_transactions: 10,
    total_calldata_bytes: 60000,
    recipient_addresses: recipients(20),
    chain_protocol_pairs: [
      'ethereum:Uniswap', 'ethereum:Aave', 'ethereum:ENS',
      'ethereum:Safe', 'arbitrum:Aave',
    ],
    gas_price_set: gasPrices(18),
    tx_hour_set: hours(12),
    create2_deployments: 0,
    bear_market_periods: ['Nov 2022 – Jan 2023'],
    execution_events: 2,
    governance_chains: ['ethereum'],
    permit_interactions: 3,
    flashloan_transactions: 0,
    smart_wallet_interactions: 1,
    erc4337_operations: 0,
    early_adoptions: 0,
    independent_votes: 3,
    earliest_deployment_timestamp: 0,
    safe_executions: 5,
    verified_deployments: 0,
    reasoned_votes: 2,
    mev_interactions: 0,
    internal_transactions: 10,
    contract_external_users: 0,
    active_contracts: 0,
  },

  // 12. Sybil-like
  {
    address: '0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1',
    first_tx_timestamp: 1700000000, // Nov 2023
    total_transactions: 500,
    contracts_deployed: 0,
    deployment_chains: [],
    deployment_calldata_bytes: 0,
    unique_protocols: ['Uniswap'],
    chains_active: ['ethereum'],
    governance_votes: 0,
    daos_participated: [],
    proposals_created: 0,
    delegation_events: 0,
    bear_market_txs: 0,
    active_month_set: ['2023-11', '2023-12'],
    protocol_categories: ['defi'],
    failed_transactions: 0,
    total_calldata_bytes: 20000,
    recipient_addresses: recipients(3),
    chain_protocol_pairs: ['ethereum:Uniswap'],
    gas_price_set: ['20', '25'],
    tx_hour_set: ['14', '15'],
    create2_deployments: 0,
    bear_market_periods: [],
    execution_events: 0,
    governance_chains: [],
    permit_interactions: 0,
    flashloan_transactions: 0,
    smart_wallet_interactions: 0,
    erc4337_operations: 0,
    early_adoptions: 0,
    independent_votes: 0,
    earliest_deployment_timestamp: 0,
    safe_executions: 0,
    verified_deployments: 0,
    reasoned_votes: 0,
    mev_interactions: 200,
    internal_transactions: 0,
    contract_external_users: 0,
    active_contracts: 0,
  },

  // 13. MEV-adjacent
  {
    address: '0x7d94b56dd10e0b2e58a9718d7b6c2e38b79ee364',
    first_tx_timestamp: 1650000000, // Apr 2022
    total_transactions: 300,
    contracts_deployed: 0,
    deployment_chains: [],
    deployment_calldata_bytes: 0,
    unique_protocols: ['Uniswap', 'SushiSwap'],
    chains_active: ['ethereum'],
    governance_votes: 0,
    daos_participated: [],
    proposals_created: 0,
    delegation_events: 0,
    bear_market_txs: 15,
    active_month_set: ['2022-04', '2022-05', '2022-06', '2022-07', '2022-08'],
    protocol_categories: ['defi'],
    failed_transactions: 5,
    total_calldata_bytes: 45000,
    recipient_addresses: recipients(8),
    chain_protocol_pairs: ['ethereum:Uniswap', 'ethereum:SushiSwap'],
    gas_price_set: gasPrices(12),
    tx_hour_set: hours(10),
    create2_deployments: 0,
    bear_market_periods: [],
    execution_events: 0,
    governance_chains: [],
    permit_interactions: 2,
    flashloan_transactions: 3,
    smart_wallet_interactions: 0,
    erc4337_operations: 0,
    early_adoptions: 0,
    independent_votes: 0,
    earliest_deployment_timestamp: 0,
    safe_executions: 0,
    verified_deployments: 0,
    reasoned_votes: 0,
    mev_interactions: 100,
    internal_transactions: 5,
    contract_external_users: 0,
    active_contracts: 0,
  },

  // 14. Average user
  {
    address: '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa',
    first_tx_timestamp: 1620000000, // May 2021
    total_transactions: 200,
    contracts_deployed: 0,
    deployment_chains: [],
    deployment_calldata_bytes: 0,
    unique_protocols: ['Uniswap', 'Aave', 'ENS'],
    chains_active: ['ethereum', 'arbitrum'],
    governance_votes: 2,
    daos_participated: ['ENS'],
    proposals_created: 0,
    delegation_events: 0,
    bear_market_txs: 10,
    active_month_set: months(2021, 12),
    protocol_categories: ['defi', 'infrastructure'],
    failed_transactions: 8,
    total_calldata_bytes: 30000,
    recipient_addresses: recipients(15),
    chain_protocol_pairs: ['ethereum:Uniswap', 'ethereum:ENS', 'arbitrum:Uniswap'],
    gas_price_set: gasPrices(15),
    tx_hour_set: hours(10),
    create2_deployments: 0,
    bear_market_periods: ['Nov 2022 – Jan 2023'],
    execution_events: 0,
    governance_chains: [],
    permit_interactions: 1,
    flashloan_transactions: 0,
    smart_wallet_interactions: 0,
    erc4337_operations: 0,
    early_adoptions: 0,
    independent_votes: 0,
    earliest_deployment_timestamp: 0,
    safe_executions: 0,
    verified_deployments: 0,
    reasoned_votes: 0,
    mev_interactions: 0,
    internal_transactions: 5,
    contract_external_users: 0,
    active_contracts: 0,
  },

  // 16. Custom wallet
  {
    address: '0x887b86B6B6957F7bbeA88B8CEfD392f39236A88C',
    first_tx_timestamp: 1609459200, // Jan 2021
    total_transactions: 950,
    contracts_deployed: 2,
    deployment_chains: ['ethereum', 'base'],
    deployment_calldata_bytes: 24000,
    unique_protocols: [
      'Uniswap', 'Aave', 'Lido', 'Curve', '1inch', 'ENS', 'Safe',
    ],
    chains_active: ['ethereum', 'arbitrum', 'base'],
    governance_votes: 8,
    daos_participated: ['ENS', 'Aave'],
    proposals_created: 0,
    delegation_events: 2,
    bear_market_txs: 35,
    active_month_set: months(2021, 30),
    protocol_categories: ['defi', 'governance', 'infrastructure'],
    failed_transactions: 18,
    total_calldata_bytes: 180000,
    recipient_addresses: recipients(35),
    chain_protocol_pairs: [
      'ethereum:Uniswap', 'ethereum:Aave', 'ethereum:Lido', 'ethereum:ENS',
      'arbitrum:Aave', 'base:Uniswap', 'base:1inch',
    ],
    gas_price_set: gasPrices(40),
    tx_hour_set: hours(14),
    create2_deployments: 1,
    bear_market_periods: ['Nov 2022 – Jan 2023'],
    execution_events: 1,
    governance_chains: ['ethereum'],
    permit_interactions: 6,
    flashloan_transactions: 0,
    smart_wallet_interactions: 1,
    erc4337_operations: 0,
    early_adoptions: 2,
    independent_votes: 3,
    earliest_deployment_timestamp: 1640000000,
    safe_executions: 1,
    verified_deployments: 1,
    reasoned_votes: 2,
    mev_interactions: 0,
    internal_transactions: 25,
    contract_external_users: 4,
    active_contracts: 1,
  },

  // 15. Excluded (burn address)
  {
    address: '0x000000000000000000000000000000000000dEaD',
    first_tx_timestamp: 1600000000,
    total_transactions: 10,
    contracts_deployed: 0,
    deployment_chains: [],
    deployment_calldata_bytes: 0,
    unique_protocols: [],
    chains_active: ['ethereum'],
    governance_votes: 0,
    daos_participated: [],
    proposals_created: 0,
    delegation_events: 0,
    bear_market_txs: 0,
    active_month_set: ['2020-09'],
    protocol_categories: [],
    failed_transactions: 0,
    total_calldata_bytes: 500,
    recipient_addresses: [],
    chain_protocol_pairs: [],
    gas_price_set: ['20'],
    tx_hour_set: ['12'],
    create2_deployments: 0,
    bear_market_periods: [],
    execution_events: 0,
    governance_chains: [],
    permit_interactions: 0,
    flashloan_transactions: 0,
    smart_wallet_interactions: 0,
    erc4337_operations: 0,
    early_adoptions: 0,
    independent_votes: 0,
    earliest_deployment_timestamp: 0,
    safe_executions: 0,
    verified_deployments: 0,
    reasoned_votes: 0,
    mev_interactions: 0,
    internal_transactions: 0,
    contract_external_users: 0,
    active_contracts: 0,
  },
];

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
