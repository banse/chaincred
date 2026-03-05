/**
 * Processes Starknet transactions into the same ProcessedEvent format used by EVM chains.
 * Starknet txs are structurally different: INVOKE/DEPLOY_ACCOUNT/DECLARE types,
 * felt252 addresses, no gas price in gwei.
 */
import type { ProcessedEvent } from './processor.js';
import type { StarknetTransaction } from './starknet-client.js';
import { lookupProtocol } from './registry/protocol-registry.js';

const SIX_MONTHS = 15_768_000;

export function processStarknetTx(
  tx: StarknetTransaction,
  blockNumber: number,
  blockTimestamp: number,
  chainId: number,
): ProcessedEvent {
  const from = tx.sender_address?.toLowerCase() ?? tx.contract_address?.toLowerCase() ?? '0x0';

  // Determine tx type from Starknet tx type
  let type: ProcessedEvent['type'] = 'generic';
  if (tx.type === 'DEPLOY_ACCOUNT' || tx.type === 'DECLARE' || tx.type === 'DEPLOY') {
    type = 'deployment';
  }

  // Extract "to" address: first element of calldata for INVOKE txs (the contract being called)
  let to: string | null = null;
  if (tx.type === 'INVOKE' && tx.calldata && tx.calldata.length > 0) {
    to = tx.calldata[0].toLowerCase();
  }
  if (tx.type === 'DEPLOY_ACCOUNT' || tx.type === 'DEPLOY') {
    to = tx.contract_address?.toLowerCase() ?? null;
  }

  // Calldata size: each felt is 32 bytes
  const calldataBytes = (tx.calldata?.length ?? 0) * 32;

  // Protocol lookup
  let protocol: string | undefined;
  let protocolCategory: string | undefined;
  let isEarlyAdoption: boolean | undefined;

  if (to) {
    const protocolDef = lookupProtocol(to);
    if (protocolDef) {
      protocol = protocolDef.name;
      protocolCategory = protocolDef.category;
      if (blockTimestamp > 0 && blockTimestamp < protocolDef.launchTimestamp + SIX_MONTHS) {
        isEarlyAdoption = true;
      }
    }
  }

  return {
    chainId,
    blockNumber,
    txHash: tx.transaction_hash,
    from,
    to,
    type,
    protocol,
    protocolCategory,
    isEarlyAdoption,
    txStatus: 1, // We only process accepted-on-L2 blocks; reverted txs checked via receipt if needed
    calldataBytes,
    gasPriceGwei: '0', // Starknet uses STRK/ETH fees, not gwei — set to 0
    timestamp: blockTimestamp,
  };
}
