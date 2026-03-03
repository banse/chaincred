import { Hono } from 'hono';
import { isValidAddress } from '@chaincred/common';
import { registerWebhook, removeWebhook, listWebhooks } from '../services/webhooks.js';

export const webhookRoutes = new Hono();

/** POST /v1/webhooks — register a webhook */
webhookRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.address || !body?.url) {
    return c.json({ error: 'Missing required fields: address, url' }, 400);
  }

  if (!isValidAddress(body.address)) {
    return c.json({ error: 'Invalid Ethereum address' }, 400);
  }

  try {
    new URL(body.url);
  } catch {
    return c.json({ error: 'Invalid webhook URL' }, 400);
  }

  const sub = await registerWebhook(body.address, body.url, body.secret);
  return c.json(sub, 201);
});

/** GET /v1/webhooks — list all webhooks */
webhookRoutes.get('/', async (c) => {
  return c.json({ webhooks: await listWebhooks() });
});

/** DELETE /v1/webhooks/:id — unregister a webhook */
webhookRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const removed = await removeWebhook(id);
  if (!removed) {
    return c.json({ error: 'Webhook not found' }, 404);
  }
  return c.json({ ok: true });
});
