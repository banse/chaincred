import { describe, expect, test, afterAll } from 'bun:test';

const mod = await import('../src/app.js');

// Start a real server for WebSocket upgrade
const server = Bun.serve({
  port: 0,
  fetch: mod.default.fetch as any,
  websocket: mod.default.websocket,
});
const baseUrl = `ws://localhost:${server.port}`;

afterAll(() => {
  server.stop(true);
});

function wsConnect(path: string): Promise<{ ws: WebSocket; messages: string[] }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${baseUrl}${path}`);
    const messages: string[] = [];

    ws.onmessage = (event) => {
      messages.push(typeof event.data === 'string' ? event.data : '');
    };

    ws.onopen = () => resolve({ ws, messages });
    ws.onerror = (e) => reject(e);
  });
}

function waitForMessages(messages: string[], count: number, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (messages.length >= count) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error('Timeout waiting for messages'));
      setTimeout(check, 50);
    };
    check();
  });
}

describe('WebSocket /v1/stream/:address', () => {
  test('connects and receives score or error message', async () => {
    const { ws, messages } = await wsConnect(
      '/v1/stream/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    );
    try {
      await waitForMessages(messages, 1);
      const msg = JSON.parse(messages[0]);
      expect(['score', 'error']).toContain(msg.type);
    } finally {
      ws.close();
    }
  });

  test('rejects invalid address', async () => {
    const { ws, messages } = await wsConnect('/v1/stream/not-an-address');
    try {
      await waitForMessages(messages, 1);
      const msg = JSON.parse(messages[0]);
      expect(msg.type).toBe('error');
      expect(msg.message).toContain('Invalid');
    } finally {
      ws.close();
    }
  });

  test('responds to ping with pong', async () => {
    const { ws, messages } = await wsConnect(
      '/v1/stream/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    );
    try {
      // Wait for initial message
      await waitForMessages(messages, 1);
      // Send ping
      ws.send('ping');
      await waitForMessages(messages, 2);
      expect(messages[1]).toBe('pong');
    } finally {
      ws.close();
    }
  });

  test('cleans up subscriptions on close', async () => {
    const { getSubscriptionCount } = await import('../src/routes/ws.js');
    const { ws, messages } = await wsConnect(
      '/v1/stream/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    );
    await waitForMessages(messages, 1);

    const countBefore = getSubscriptionCount();
    expect(countBefore).toBeGreaterThanOrEqual(1);

    ws.close();
    // Wait for close to propagate
    await new Promise((r) => setTimeout(r, 200));
    const countAfter = getSubscriptionCount();
    expect(countAfter).toBeLessThan(countBefore);
  });
});
