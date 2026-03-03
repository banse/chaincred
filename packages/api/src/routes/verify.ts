import { Hono } from 'hono';
import type { VerifyRequest } from '@chaincred/common';

export const verifyRoutes = new Hono();

verifyRoutes.post('/', async (c) => {
  const body = await c.req.json<VerifyRequest>();
  // TODO: Verify Merkle proof against on-chain root
  return c.json({
    verified: false,
    message: 'Verification not yet implemented',
    address: body.address,
    score: body.score,
  });
});
