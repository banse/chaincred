/** PRD 4.2 — Known governance contract addresses → DAO name */
export const DAO_REGISTRY = new Map<string, string>([
  // --- Ethereum Mainnet ---
  // Compound Governor Bravo
  ['0xc0da02939e1441f497fd74f78ce7decb17b66529', 'Compound'],
  // Compound Governor Bravo Delegator
  ['0xc0da01a04c3f3e0be433606045bb7017a7323e38', 'Compound'],
  // Uniswap Governor
  ['0x408ed6354d4973f66138c91495f2f2fcbd8724c3', 'Uniswap'],
  // Aave Governance V2
  ['0xec568fffba86c094cf06b22134b23074dfe2252c', 'Aave'],
  // Aave Governance V3
  ['0x9aee0b04504cef83a65ac3f0e838d0593bcb2bc7', 'Aave'],
  // ENS Governor
  ['0x323a76393544d5ecca80cd6ef2a560c6a395b7e3', 'ENS'],
  // Nouns DAO
  ['0x6f3e6272a167e8accb32072d08e0957f9c79223d', 'Nouns'],
  // Nouns DAO V3
  ['0xdd1492570beb290a2f309541e1fddeb9ac484a65', 'Nouns'],
  // Gitcoin Governor
  ['0xdbd27635a534a3d3169ef0498beb56fb9c937489', 'Gitcoin'],
  // MakerDAO Chief (DS-Chief)
  ['0x0a3f6849f78076aefadf113f5bed87720274ddc0', 'MakerDAO'],
  // MakerDAO Governance (vote proxy factory)
  ['0x6fce4a401b6b80ace52baaefe4421bd188e76f6f', 'MakerDAO'],
  // Safe DAO
  ['0x0ee56d07c39e2f0e527083b1a7e3e40e53fa5368', 'Safe'],
  // Hop DAO Governor
  ['0xed8bdb5895b8b7f9fdb3c087628fd8389bfce8ec', 'Hop'],
  // Lido DAO (Aragon)
  ['0x2e59a20f205bb85a89c53f1936454680651e618e', 'Lido'],
  // Curve DAO (VotingEscrow / gauge voting)
  ['0x5f3b5dfeb7b28cdbd7faba78963ee202a494e2a2', 'Curve'],

  // Frax Governor
  ['0xe8a2386a7472c82396bb1ec293407dc57fabca87', 'Frax'],
  // Stargate Governor
  ['0x5c30e2e6a96c27d0e944510d1d8e0f2e8b10d0d5', 'Stargate'],
  // dYdX Governor
  ['0x7e9b1672616ff6d6629ef2879419644f0ee4c29e', 'dYdX'],
  // Synthetix Governor
  ['0x2169ab2c9f57b6773a949d14b701b3aeb08e2053', 'Synthetix'],
  // ApeCoin DAO
  ['0xaeaa54b5f7b3e52e7067ef30e0f56cead6d6d7d0', 'ApeCoin'],
  // Yearn Governance
  ['0xba37b002abafdd8e89a1995da52740bbc013d992', 'Yearn'],
  // Treasure DAO Governor
  ['0xec20c13d24d37dd02bce3bcbca2014ad70beff1a', 'Treasure'],
  // Compound Timelock
  ['0x6d903f6003cca6255d85cca4d3b5e5146dc33925', 'Compound'],
  // Uniswap Timelock
  ['0x1a9c8182c09f50c8318d769245beaa52c32be35d', 'Uniswap'],
  // ENS Timelock
  ['0xfe89cc7abb2c4183683ab71653c4cdc9b02d44b7', 'ENS'],

  // --- Arbitrum ---
  // Arbitrum Governor (Core)
  ['0xf07ded9dc292157749b6fd268e37df6ea38395b9', 'Arbitrum'],
  // Arbitrum Governor (Treasury)
  ['0x789fc99093b09ad01c34dc7251d0c89ce743e5a4', 'Arbitrum'],
  // Arbitrum Token (delegation target)
  ['0x912ce59144191c1204e64559fe8253a0e49e6548', 'Arbitrum'],
  // GMX Governor
  ['0x7b0269404a58d1d455b3086e57d7c5b4bb605a4f', 'GMX'],
  // Radiant Governor
  ['0xd3b2b4ebe3a3e36abcd0ccf880aca0b3d91eb23e', 'Radiant'],
  // Camelot Governor
  ['0x8aa89e29e40893e81e10eea96efef7bdf16b7a8b', 'Camelot'],

  // --- Optimism ---
  // Optimism Governor
  ['0xcdf27f107725988f2261ce2256bdfcde8b382b10', 'Optimism'],
  // Optimism Token (delegation target)
  ['0x4200000000000000000000000000000000000042', 'Optimism'],
  // Synthetix Governor OP
  ['0x098a224d62e8f0c63e7234abb6b8aee6ab0f4016', 'Synthetix'],

  // --- Base ---
  // Base token does not have on-chain governance yet

  // --- Polygon ---
  // Polygon Governance (Timelock)
  ['0x6e7a5820badb04c6911de5fa6b293cfe32fd0a49', 'Polygon'],
  // QuickSwap Governor
  ['0xf29f70d8b81fce73c9b84fcf0fdd20a069250f99', 'QuickSwap'],
]);
