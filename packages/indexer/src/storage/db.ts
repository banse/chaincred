import { getDb, SUPPORTED_CHAINS } from '@chaincred/common';
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

      await sql`
        INSERT INTO wallet_activity (address, first_tx_timestamp, total_transactions, contracts_deployed, unique_protocols, chains_active, governance_votes, daos_participated, updated_at)
        VALUES (
          ${address},
          ${event.timestamp},
          1,
          ${event.type === 'deployment' ? 1 : 0},
          ${event.protocol ? sql.array([event.protocol]) : sql.array([], 25)},
          ${sql.array([chainSlug])},
          ${event.type === 'governance' ? 1 : 0},
          ${event.dao ? sql.array([event.dao]) : sql.array([], 25)},
          ${Date.now()}
        )
        ON CONFLICT (address) DO UPDATE SET
          first_tx_timestamp = LEAST(wallet_activity.first_tx_timestamp, EXCLUDED.first_tx_timestamp),
          total_transactions = wallet_activity.total_transactions + 1,
          contracts_deployed = wallet_activity.contracts_deployed + ${event.type === 'deployment' ? 1 : 0},
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
