import { Hono } from 'hono';
import { isValidAddress, getDb } from '@chaincred/common';

export const appealRoutes = new Hono();

/** POST /v1/appeals — submit a sybil appeal */
appealRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.address || !body?.reason) {
    return c.json({ error: 'Missing required fields: address, reason' }, 400);
  }

  if (!isValidAddress(body.address)) {
    return c.json({ error: 'Invalid Ethereum address' }, 400);
  }

  const sql = getDb();
  const id = crypto.randomUUID();
  const now = Date.now();
  const address = body.address.toLowerCase();

  await sql`
    INSERT INTO appeals (id, address, reason, status, created_at)
    VALUES (${id}, ${address}, ${body.reason}, 'pending', ${now})
  `;

  return c.json({ id, address, reason: body.reason, status: 'pending', createdAt: now }, 201);
});

/** GET /v1/appeals/:address — check appeal status */
appealRoutes.get('/:address', async (c) => {
  const address = c.req.param('address');
  if (!isValidAddress(address)) {
    return c.json({ error: 'Invalid Ethereum address' }, 400);
  }

  const sql = getDb();
  const [row] = await sql`
    SELECT id, address, reason, status, created_at FROM appeals
    WHERE address = ${address.toLowerCase()}
    ORDER BY created_at DESC LIMIT 1
  `;

  if (!row) {
    return c.json({ error: 'No appeal found for this address' }, 404);
  }

  return c.json({
    id: row.id,
    address: row.address,
    reason: row.reason,
    status: row.status,
    createdAt: Number(row.created_at),
  });
});
