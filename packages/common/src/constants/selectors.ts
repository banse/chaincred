/** PRD 4.6 — EIP-712 Permit function selectors */
export const PERMIT_SELECTORS = new Set([
  '0xd505accf', // permit(address,address,uint256,uint256,uint8,bytes32,bytes32) — ERC-2612
  '0x30f28b7a', // permitTransferFrom (Permit2)
  '0x2b67b570', // permitBatchTransferFrom (Permit2 batch)
]);

/** PRD 4.6 — Flashloan function selectors */
export const FLASHLOAN_SELECTORS = new Set([
  '0xab9c4b5d', // flashLoan (Aave V2)
  '0x42b0b77c', // flashLoan (Aave V3)
  '0x5cffe9de', // flashLoan (Balancer)
  '0x490e6cbc', // flash (Uniswap V3)
  '0xa67a6a45', // operate (dYdX)
]);

/** PRD 4.2 — ERC-4337 Account Abstraction function selectors */
export const ERC4337_SELECTORS = new Set([
  '0x1fad948c', // handleOps
  '0x4b1d7cf5', // handleAggregatedOps
]);

/** PRD 4.6 — ERC-4337 EntryPoint contract addresses */
export const ERC4337_ENTRYPOINTS = new Set([
  '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', // EntryPoint v0.6
  '0x0000000071727de22e5e9d8baf0edac6f37da032', // EntryPoint v0.7
]);
