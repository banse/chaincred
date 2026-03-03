import { Hono } from 'hono';
import { validateAddress } from '../middleware/validate-address.js';
import { getAttestation } from '../services/attestation.js';

export const attestationRoutes = new Hono();

attestationRoutes.get('/:address', validateAddress, async (c) => {
  const address = c.req.param('address');
  const attestation = await getAttestation(address);
  return c.json(attestation);
});
