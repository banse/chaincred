import type { MiddlewareHandler } from 'hono';
import { isValidAddress } from '@chaincred/common';

export const validateAddress: MiddlewareHandler = async (c, next) => {
  const address = c.req.param('address');
  if (!address || !isValidAddress(address)) {
    return c.json({ error: 'Invalid Ethereum address' }, 400);
  }
  await next();
};
