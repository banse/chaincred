import { getDb, SUPPORTED_CHAINS, isInBearMarket } from '@chaincred/common';
import type { ProcessedEvent } from '../processor.js';

export interface StorageLayer {
  saveEvent(event: ProcessedEvent): Promise<void>;
  getLastProcessedBlock(chainId: number): Promise<number>;
  setLastProcessedBlock(chainId: number, block: number): Promise<void>;
}

const chainSlugById = new Map(SUPPORTED_CHAINS.map((c) => [c.id, c.slug]));

export function createStorage(): StorageLayer {
  const sql = getDb();

  return {
    async saveEvent(event: ProcessedEvent) {
      await sql`
        INSERT INTO events (chain_id, block_number, tx_hash, from_address, to_address, type, protocol, timestamp)
        VALUES (${event.chainId}, ${event.blockNumber}, ${event.txHash}, ${event.from.toLowerCase()}, ${event.to?.toLowerCase() ?? null}, ${event.type}, ${event.protocol ?? null}, ${event.timestamp})
      `;

      const address = event.from.toLowerCase();
      const chainSlug = chainSlugById.get(event.chainId) ?? String(event.chainId);

      // Compute derived signals
      const isProposal = event.type === 'governance' && event.governanceSubtype === 'propose' ? 1 : 0;
      const isDelegation = event.type === 'governance' && event.governanceSubtype === 'delegate' ? 1 : 0;
      const isBearMarketTx = isInBearMarket(event.timestamp) ? 1 : 0;
      const isFailed = event.txStatus === 0 ? 1 : 0;
      const monthStr = new Date(event.timestamp * 1000).toISOString().slice(0, 7); // "YYYY-MM"
      const recipientAddr = event.to?.toLowerCase() ?? null;
      const chainProtocolPair = event.protocol ? `${chainSlug}:${event.protocol}` : null;

      await sql`
        INSERT INTO wallet_activity (
          address, first_tx_timestamp, total_transactions, contracts_deployed,
          deployment_chains, deployment_calldata_bytes,
          unique_protocols, chains_active, governance_votes, daos_participated,
          proposals_created, delegation_events, bear_market_txs,
          active_month_set, protocol_categories,
          failed_transactions, total_calldata_bytes,
          recipient_addresses, chain_protocol_pairs, gas_price_set,
          updated_at
        )
        VALUES (
          ${address},
          ${event.timestamp},
          1,
          ${event.type === 'deployment' ? 1 : 0},
          ${event.type === 'deployment' ? sql.array([chainSlug]) : sql.array([], 25)},
          ${event.type === 'deployment' ? event.calldataBytes : 0},
          ${event.protocol ? sql.array([event.protocol]) : sql.array([], 25)},
          ${sql.array([chainSlug])},
          ${event.type === 'governance' ? 1 : 0},
          ${event.dao ? sql.array([event.dao]) : sql.array([], 25)},
          ${isProposal},
          ${isDelegation},
          ${isBearMarketTx},
          ${sql.array([monthStr])},
          ${event.protocolCategory ? sql.array([event.protocolCategory]) : sql.array([], 25)},
          ${isFailed},
          ${event.calldataBytes},
          ${recipientAddr ? sql.array([recipientAddr]) : sql.array([], 25)},
          ${chainProtocolPair ? sql.array([chainProtocolPair]) : sql.array([], 25)},
          ${sql.array([event.gasPriceGwei])},
          ${Date.now()}
        )
        ON CONFLICT (address) DO UPDATE SET
          first_tx_timestamp = LEAST(wallet_activity.first_tx_timestamp, EXCLUDED.first_tx_timestamp),
          total_transactions = wallet_activity.total_transactions + 1,
          contracts_deployed = wallet_activity.contracts_deployed + ${event.type === 'deployment' ? 1 : 0},
          deployment_chains = CASE
            WHEN ${event.type === 'deployment' ? chainSlug : null} IS NOT NULL AND NOT (${event.type === 'deployment' ? chainSlug : ''} = ANY(wallet_activity.deployment_chains))
            THEN array_append(wallet_activity.deployment_chains, ${event.type === 'deployment' ? chainSlug : ''})
            ELSE wallet_activity.deployment_chains
          END,
          deployment_calldata_bytes = wallet_activity.deployment_calldata_bytes + ${event.type === 'deployment' ? event.calldataBytes : 0},
          unique_protocols = CASE
            WHEN ${event.protocol ?? null} IS NOT NULL AND NOT (${event.protocol ?? ''} = ANY(wallet_activity.unique_protocols))
            THEN array_append(wallet_activity.unique_protocols, ${event.protocol ?? ''})
            ELSE wallet_activity.unique_protocols
          END,
          chains_active = CASE
            WHEN NOT (${chainSlug} = ANY(wallet_activity.chains_active))
            THEN array_append(wallet_activity.chains_active, ${chainSlug})
            ELSE wallet_activity.chains_active
          END,
          governance_votes = wallet_activity.governance_votes + ${event.type === 'governance' ? 1 : 0},
          daos_participated = CASE
            WHEN ${event.dao ?? null} IS NOT NULL AND NOT (${event.dao ?? ''} = ANY(wallet_activity.daos_participated))
            THEN array_append(wallet_activity.daos_participated, ${event.dao ?? ''})
            ELSE wallet_activity.daos_participated
          END,
          proposals_created = wallet_activity.proposals_created + ${isProposal},
          delegation_events = wallet_activity.delegation_events + ${isDelegation},
          bear_market_txs = wallet_activity.bear_market_txs + ${isBearMarketTx},
          active_month_set = CASE
            WHEN NOT (${monthStr} = ANY(wallet_activity.active_month_set))
            THEN array_append(wallet_activity.active_month_set, ${monthStr})
            ELSE wallet_activity.active_month_set
          END,
          protocol_categories = CASE
            WHEN ${event.protocolCategory ?? null} IS NOT NULL AND NOT (${event.protocolCategory ?? ''} = ANY(wallet_activity.protocol_categories))
            THEN array_append(wallet_activity.protocol_categories, ${event.protocolCategory ?? ''})
            ELSE wallet_activity.protocol_categories
          END,
          failed_transactions = wallet_activity.failed_transactions + ${isFailed},
          total_calldata_bytes = wallet_activity.total_calldata_bytes + ${event.calldataBytes},
          recipient_addresses = CASE
            WHEN ${recipientAddr ?? null} IS NOT NULL AND NOT (${recipientAddr ?? ''} = ANY(wallet_activity.recipient_addresses))
            THEN array_append(wallet_activity.recipient_addresses, ${recipientAddr ?? ''})
            ELSE wallet_activity.recipient_addresses
          END,
          chain_protocol_pairs = CASE
            WHEN ${chainProtocolPair ?? null} IS NOT NULL AND NOT (${chainProtocolPair ?? ''} = ANY(wallet_activity.chain_protocol_pairs))
            THEN array_append(wallet_activity.chain_protocol_pairs, ${chainProtocolPair ?? ''})
            ELSE wallet_activity.chain_protocol_pairs
          END,
          gas_price_set = CASE
            WHEN NOT (${event.gasPriceGwei} = ANY(wallet_activity.gas_price_set))
            THEN array_append(wallet_activity.gas_price_set, ${event.gasPriceGwei})
            ELSE wallet_activity.gas_price_set
          END,
          updated_at = ${Date.now()}
      `;
    },

    async getLastProcessedBlock(chainId: number) {
      const [row] = await sql`
        SELECT last_block FROM indexer_cursors WHERE chain_id = ${chainId}
      `;
      return row ? Number(row.last_block) : 0;
    },

    async setLastProcessedBlock(chainId: number, block: number) {
      await sql`
        INSERT INTO indexer_cursors (chain_id, last_block, updated_at)
        VALUES (${chainId}, ${block}, ${Date.now()})
        ON CONFLICT (chain_id) DO UPDATE SET
          last_block = EXCLUDED.last_block,
          updated_at = EXCLUDED.updated_at
      `;
    },
  };
}
