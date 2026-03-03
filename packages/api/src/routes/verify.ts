import { Hono } from 'hono';
import { createPublicClient, http, type Address } from 'viem';
import { mainnet } from 'viem/chains';
import type { VerifyRequest } from '@chaincred/common';

export const verifyRoutes = new Hono();

const SCORE_MERKLE_ADDRESS = process.env.SCORE_MERKLE_ADDRESS as Address | undefined;
const RPC_URL = process.env.RPC_URL || undefined;

const scoreMerkleAbi = [
  {
    name: 'verifyScore',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'score', type: 'uint256' },
      { name: 'proof', type: 'bytes32[]' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'merkleRoot',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    name: 'epoch',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

function getClient() {
  return createPublicClient({
    chain: mainnet,
    transport: http(RPC_URL),
  });
}

verifyRoutes.post('/', async (c) => {
  const body = await c.req.json<VerifyRequest>();

  if (!SCORE_MERKLE_ADDRESS) {
    return c.json({ verified: false, message: 'Verification contract not configured' }, 503);
  }

  const client = getClient();

  const verified = await client.readContract({
    address: SCORE_MERKLE_ADDRESS,
    abi: scoreMerkleAbi,
    functionName: 'verifyScore',
    args: [body.address as Address, BigInt(body.score), body.proof as `0x${string}`[]],
  });

  const epoch = await client.readContract({
    address: SCORE_MERKLE_ADDRESS,
    abi: scoreMerkleAbi,
    functionName: 'epoch',
  });

  return c.json({
    verified,
    address: body.address,
    score: body.score,
    epoch: Number(epoch),
  });
});
