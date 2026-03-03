import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';
import { isValidAddress } from '@chaincred/common';
import { getScore } from '../services/score.js';

const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

/** address → set of connected websockets */
const subscriptions = new Map<string, Set<ServerWebSocket>>();

export function getSubscriptionCount(): number {
  let count = 0;
  for (const set of subscriptions.values()) {
    count += set.size;
  }
  return count;
}

/** Periodic push: refresh scores for subscribed addresses every 60s */
const PUSH_INTERVAL_MS = 60_000;
let pushTimer: ReturnType<typeof setInterval> | null = null;

function startPushInterval() {
  if (pushTimer) return;
  pushTimer = setInterval(async () => {
    for (const [address, sockets] of subscriptions) {
      if (sockets.size === 0) continue;
      try {
        const score = await getScore(address);
        const msg = JSON.stringify({ type: 'score', data: score });
        for (const ws of sockets) {
          ws.send(msg);
        }
      } catch {
        // Score unavailable — skip this cycle
      }
    }
  }, PUSH_INTERVAL_MS);
}

function stopPushInterval() {
  if (pushTimer && getSubscriptionCount() === 0) {
    clearInterval(pushTimer);
    pushTimer = null;
  }
}

export const wsRoutes = new Hono();

wsRoutes.get(
  '/stream/:address',
  upgradeWebSocket((c) => {
    const address = c.req.param('address');

    return {
      onOpen: async (_event, ws) => {
        const raw = ws.raw as ServerWebSocket;

        if (!address || !isValidAddress(address)) {
          raw.send(JSON.stringify({ type: 'error', message: 'Invalid Ethereum address' }));
          raw.close(1008, 'Invalid address');
          return;
        }

        const key = address.toLowerCase();

        // Track subscription
        if (!subscriptions.has(key)) {
          subscriptions.set(key, new Set());
        }
        subscriptions.get(key)!.add(raw);
        startPushInterval();

        // Send current score immediately
        try {
          const score = await getScore(key);
          raw.send(JSON.stringify({ type: 'score', data: score }));
        } catch {
          raw.send(JSON.stringify({ type: 'error', message: 'Score not available' }));
        }
      },

      onMessage: (event, ws) => {
        const raw = ws.raw as ServerWebSocket;
        // Handle ping
        if (event.data === 'ping') {
          raw.send('pong');
        }
      },

      onClose: (_event, ws) => {
        const raw = ws.raw as ServerWebSocket;
        if (!address) return;
        const key = address.toLowerCase();
        const set = subscriptions.get(key);
        if (set) {
          set.delete(raw);
          if (set.size === 0) {
            subscriptions.delete(key);
          }
        }
        stopPushInterval();
      },
    };
  }),
);

export { websocket };
