import { Hono } from 'hono';
import { validateAddress } from '../middleware/validate-address.js';
import { cache } from '../middleware/cache.js';
import { getDb } from '@chaincred/common';

export const proofRoutes = new Hono();

proofRoutes.get('/:address', validateAddress, cache(600), async (c) => {
  const address = c.req.param('address').toLowerCase();
  const sql = getDb();

  const [row] = await sql`
    SELECT address, score, proof, root, created_at FROM merkle_proofs WHERE address = ${address}
  `;

  if (!row) {
    return c.json({ error: 'No proof found for this address' }, 404);
  }

  return c.json({
    address: row.address,
    score: row.score,
    proof: row.proof,
    root: row.root,
    generatedAt: Number(row.created_at),
  });
});
