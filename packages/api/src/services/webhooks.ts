export interface WebhookSubscription {
  id: string;
  url: string;
  address: string;
  secret?: string;
  createdAt: number;
}

/** address → subscriptions */
const subscriptions = new Map<string, WebhookSubscription[]>();

export function registerWebhook(
  address: string,
  url: string,
  secret?: string,
): WebhookSubscription {
  const sub: WebhookSubscription = {
    id: crypto.randomUUID(),
    url,
    address: address.toLowerCase(),
    secret,
    createdAt: Date.now(),
  };

  const key = address.toLowerCase();
  if (!subscriptions.has(key)) {
    subscriptions.set(key, []);
  }
  subscriptions.get(key)!.push(sub);
  return sub;
}

export function removeWebhook(id: string): boolean {
  for (const [key, subs] of subscriptions) {
    const idx = subs.findIndex((s) => s.id === id);
    if (idx !== -1) {
      subs.splice(idx, 1);
      if (subs.length === 0) subscriptions.delete(key);
      return true;
    }
  }
  return false;
}

export function listWebhooks(): WebhookSubscription[] {
  const all: WebhookSubscription[] = [];
  for (const subs of subscriptions.values()) {
    all.push(...subs);
  }
  return all;
}

/** Fire-and-forget POST to registered webhook URLs */
export async function deliverWebhooks(address: string, score: any): Promise<void> {
  const key = address.toLowerCase();
  const subs = subscriptions.get(key);
  if (!subs || subs.length === 0) return;

  const payload = JSON.stringify({
    event: 'score.updated',
    address: key,
    score,
    timestamp: Date.now(),
  });

  for (const sub of subs) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (sub.secret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(sub.secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
      const hex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      headers['X-ChainCred-Signature'] = hex;
    }

    // Fire and forget
    fetch(sub.url, { method: 'POST', headers, body: payload }).catch(() => {});
  }
}
