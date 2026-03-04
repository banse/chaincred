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

/** PRD 4.3 — Safe multi-sig execTransaction selector */
export const SAFE_EXEC_SELECTOR = '0x6a761202';

/** PRD 4.3 — Reasoned vote function selectors (castVoteWithReason variants) */
export const REASONED_VOTE_SELECTORS = new Set([
  '0x7b3c71d3', // castVoteWithReason(uint256,uint8,string)
  '0x5f398a14', // castVoteWithReasonAndParams(uint256,uint8,string,bytes)
  '0x15373e3d', // castVoteWithReasonAndParamsBySig(...)
]);

/** PRD 4.6 — ERC-4337 EntryPoint contract addresses */
export const ERC4337_ENTRYPOINTS = new Set([
  '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789', // EntryPoint v0.6
  '0x0000000071727de22e5e9d8baf0edac6f37da032', // EntryPoint v0.7
]);

/** PRD 5.2 — Known CEX hot wallet addresses (lowercase) */
export const CEX_HOT_WALLETS = new Set([
  '0x28c6c06298d514db089934071355e5743bf21d60', // Binance 14
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 15
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', // Binance 16
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43', // Coinbase 10
  '0x503828976d22510aad0201ac7ec88293211d23da', // Coinbase 6
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', // Coinbase 3
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2', // Kraken 13
  '0x53d284357ec70ce289d6d64134dfac8e511c8a3d', // Kraken 4
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b', // OKX 6
  '0x98ec059dc3adfbdd63429227115656b07c44a2e1', // OKX 8
  '0xd24400ae8bfebb18ca49be86258a3c749cf46853', // Gemini 4
  '0x07ee55aa48bb72dcc6e9d78256648910de513eca', // Gemini 7
]);
