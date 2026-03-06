#!/usr/bin/env bun
/**
 * Single-wallet indexer CLI — thin wrapper around index-wallet-core.
 * Usage: bun run index-wallet <address>
 */
import { indexWallet } from '../index-wallet-core.js';
import { isValidStarknetAddress } from '@chaincred/common';

async function main() {
  const address = process.argv[2];
  if (!address || !address.startsWith('0x')) {
    console.error('Usage: bun run index-wallet <0x address>');
    process.exit(1);
  }

  const isStarknet = isValidStarknetAddress(address) && address.length !== 42;
  const isEvm = address.length === 42;

  if (!isStarknet && !isEvm) {
    console.error('Invalid address format. Provide an EVM (0x + 40 hex) or Starknet (0x + up to 64 hex) address.');
    process.exit(1);
  }

  console.log(`\nIndexing wallet: ${address}${isStarknet ? ' (Starknet)' : ''}`);

  const result = await indexWallet(address, (msg) => console.log(`  ${msg}`));

  console.log(`\nDone: ${result.totalTxs} txs across ${result.chainsActive} chains in ${(result.elapsedMs / 1000).toFixed(1)}s`);
  if (result.ensName) console.log(`ENS: ${result.ensName}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
