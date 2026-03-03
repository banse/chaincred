import { getDb } from '@chaincred/common';

export interface TimelineEvent {
  type: 'first_tx' | 'first_deployment' | 'first_governance' | 'chain_added' | 'badge_earned';
  timestamp: number;
  chain?: string;
  detail?: string;
}

/** Derive milestone events from existing events + wallet_activity tables. */
export async function getTimeline(address: string): Promise<TimelineEvent[]> {
  const sql = getDb();
  const addr = address.toLowerCase();

  // Query milestone timestamps from events table
  const rows = await sql`
    SELECT
      type,
      chain_id,
      MIN(timestamp) AS first_seen
    FROM events
    WHERE from_address = ${addr}
    GROUP BY type, chain_id
    ORDER BY first_seen ASC
  `;

  if (rows.length === 0) return [];

  const chainNames: Record<number, string> = {
    1: 'ethereum',
    42161: 'arbitrum',
    10: 'optimism',
    8453: 'base',
    324: 'zksync',
    137: 'polygon',
  };

  const events: TimelineEvent[] = [];
  const seenTypes = new Set<string>();
  const seenChains = new Set<string>();

  for (const row of rows) {
    const chain = chainNames[Number(row.chain_id)] ?? `chain-${row.chain_id}`;
    const ts = Number(row.first_seen);
    const type = row.type as string;

    // First ever transaction
    if (!seenTypes.has('first_tx')) {
      seenTypes.add('first_tx');
      events.push({ type: 'first_tx', timestamp: ts, chain });
    }

    // First deployment
    if (type === 'deployment' && !seenTypes.has('first_deployment')) {
      seenTypes.add('first_deployment');
      events.push({ type: 'first_deployment', timestamp: ts, chain });
    }

    // First governance
    if (type === 'governance' && !seenTypes.has('first_governance')) {
      seenTypes.add('first_governance');
      events.push({ type: 'first_governance', timestamp: ts, chain });
    }

    // Chain additions (after the first chain)
    if (!seenChains.has(chain)) {
      seenChains.add(chain);
      if (seenChains.size > 1) {
        events.push({ type: 'chain_added', timestamp: ts, chain });
      }
    }
  }

  // Badge milestone events — derive when badges were first earned
  // Builder badge: 3rd deployment
  const builderRow = await sql`
    SELECT timestamp FROM events
    WHERE from_address = ${addr} AND type = 'deployment'
    ORDER BY timestamp LIMIT 1 OFFSET 2
  `;
  if (builderRow.length > 0) {
    events.push({ type: 'badge_earned', timestamp: Number(builderRow[0].timestamp), detail: 'builder' });
  }

  // Governor badge: 5th governance event
  const govRow = await sql`
    SELECT timestamp FROM events
    WHERE from_address = ${addr} AND type = 'governance'
    ORDER BY timestamp LIMIT 1 OFFSET 4
  `;
  if (govRow.length > 0) {
    events.push({ type: 'badge_earned', timestamp: Number(govRow[0].timestamp), detail: 'governor' });
  }

  // OG badge: first tx before Jan 2020
  const OG_CUTOFF = 1577836800; // 2020-01-01
  const firstTxRow = await sql`
    SELECT MIN(timestamp) AS ts FROM events WHERE from_address = ${addr}
  `;
  if (firstTxRow.length > 0 && Number(firstTxRow[0].ts) > 0 && Number(firstTxRow[0].ts) < OG_CUTOFF) {
    events.push({ type: 'badge_earned', timestamp: Number(firstTxRow[0].ts), detail: 'og' });
  }

  // Multichain badge: when 4th distinct chain appears
  const chainRows = await sql`
    SELECT chain_id, MIN(timestamp) AS first_seen FROM events
    WHERE from_address = ${addr}
    GROUP BY chain_id ORDER BY first_seen
  `;
  if (chainRows.length >= 4) {
    events.push({
      type: 'badge_earned',
      timestamp: Number(chainRows[3].first_seen),
      detail: 'multichain',
    });
  }

  // Explorer badge: when 20th unique protocol appears
  const protocolRows = await sql`
    SELECT protocol, MIN(timestamp) AS first_seen
    FROM events WHERE from_address = ${addr} AND protocol IS NOT NULL
    GROUP BY protocol ORDER BY first_seen
  `;
  if (protocolRows.length >= 20) {
    events.push({ type: 'badge_earned', timestamp: Number(protocolRows[19].first_seen), detail: 'explorer' });
  }

  events.sort((a, b) => a.timestamp - b.timestamp);
  return events;
}
