import { getDb } from '@chaincred/common';

export interface WebhookSubscription {
  id: string;
  url: string;
  address: string;
  secret?: string;
  createdAt: number;
}

export async function registerWebhook(
  address: string,
  url: string,
  secret?: string,
): Promise<WebhookSubscription> {
  const sql = getDb();
  const sub: WebhookSubscription = {
    id: crypto.randomUUID(),
    url,
    address: address.toLowerCase(),
    secret,
    createdAt: Date.now(),
  };

  await sql`
    INSERT INTO webhooks (id, address, url, secret, created_at)
    VALUES (${sub.id}, ${sub.address}, ${sub.url}, ${sub.secret ?? null}, ${sub.createdAt})
  `;

  return sub;
}

export async function removeWebhook(id: string): Promise<boolean> {
  const sql = getDb();
  const result = await sql`DELETE FROM webhooks WHERE id = ${id}`;
  return result.count > 0;
}

export async function listWebhooks(): Promise<WebhookSubscription[]> {
  const sql = getDb();
  const rows = await sql`SELECT id, address, url, secret, created_at FROM webhooks`;
  return rows.map((row) => ({
    id: row.id as string,
    url: row.url as string,
    address: row.address as string,
    secret: (row.secret as string) || undefined,
    createdAt: Number(row.created_at),
  }));
}

/** Fire-and-forget POST to registered webhook URLs */
export async function deliverWebhooks(address: string, score: any): Promise<void> {
  const sql = getDb();
  const key = address.toLowerCase();
  const rows = await sql`SELECT url, secret FROM webhooks WHERE address = ${key}`;
  if (rows.length === 0) return;

  const payload = JSON.stringify({
    event: 'score.updated',
    address: key,
    score,
    timestamp: Date.now(),
  });

  for (const row of rows) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (row.secret) {
      const encoder = new TextEncoder();
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(row.secret as string),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
      const hex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      headers['X-ChainCred-Signature'] = hex;
    }

    // Fire and forget
    fetch(row.url as string, { method: 'POST', headers, body: payload }).catch(() => {});
  }
}
