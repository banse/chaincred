import { STARKNET_CHAIN_ID } from './chains.js';

/** PRD 4.5 — Protocol categories for badge assignment */
export type ProtocolCategory =
  | 'defi'
  | 'governance'
  | 'infrastructure'
  | 'social'
  | 'gaming'
  | 'builder-tools';

export interface ProtocolDefinition {
  name: string;
  category: ProtocolCategory;
  contracts: Record<number, string[]>; // chainId → contract addresses
  /** PRD 4.5 — Protocol launch date (unix seconds) for early adoption scoring */
  launchTimestamp: number;
}

/** Protocol registry — multi-chain contract mappings for scoring */
export const PROTOCOL_REGISTRY: ProtocolDefinition[] = [
  {
    name: 'Uniswap',
    category: 'defi',
    launchTimestamp: 1541030400, // Nov 2018
    contracts: {
      // V2 Router, V3 SwapRouter02, UniversalRouter
      1: [
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        '0x66a9893cc07d91d95644aedd05d03f95e1dba8af',
      ],
      42161: [
        '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
        '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        '0xa51afafe0263b40edaef0df8781ea9aa03e381a3',
      ],
      10: [
        '0x4A7b5Da61326A6379179b40d00F57E5bbDC962c2',
        '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        '0x851116d9223fabed8e56c0e6b8ad0c31d98b3507',
      ],
      8453: [
        '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
        '0x2626664c2603336E57B271c5C0b26F421741e481',
        '0x6fF5693b99212Da76ad316178A184AB56D299b43',
      ],
      324: [
        '0x99c56385daBCE3E81d8499d0b8d0257aBC07E8A3',
        '0x28731BCC616B5f51dD52CF2e4dF0E78dD1136C06',
      ],
      137: [
        '0xedf6066a2b290C185783862C7F4776A2C8077AD1',
        '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        '0x1095692A6237d83C6a72F3F5eFEdb9A670C49223',
      ],
    },
  },
  {
    name: 'Aave',
    category: 'defi',
    launchTimestamp: 1577836800, // Jan 2020
    contracts: {
      // V3 Pool
      1: ['0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'],
      42161: ['0x794a61358D6845594F94dc1DB02A252b5b4814aD'],
      10: ['0x794a61358D6845594F94dc1DB02A252b5b4814aD'],
      8453: ['0xA238Dd80C259a72e81d7e4664a9801593F98d1c5'],
      324: ['0x78e30497a3c7527d953c6b1e3541b021a98ac43c'],
      137: ['0x794a61358D6845594F94dc1DB02A252b5b4814aD'],
    },
  },
  {
    name: 'Compound',
    category: 'defi',
    launchTimestamp: 1535760000, // Sep 2018
    contracts: {
      // V3 Comet USDC
      1: ['0xc3d688B66703497DAA19211EEdff47f25384cdc3'],
      42161: ['0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf'],
      8453: ['0xb125E6687d4313864e53df431d5425969c15Eb2F'],
      137: ['0xF25212E676D1F7F89Cd72fFEe66158f541246445'],
    },
  },
  {
    name: 'Lido',
    category: 'defi',
    launchTimestamp: 1607904000, // Dec 2020
    contracts: {
      // stETH + wstETH on Ethereum; wstETH bridged on L2s
      1: [
        '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
        '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
      ],
      42161: ['0x5979D7b546E38E414F7E9822514be443A4800529'],
      10: ['0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb'],
      8453: ['0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452'],
      324: ['0x703b52F2b28fEbcB60E1372858AF5b18849FE867'],
      137: ['0x03b54A6e9a984069379fae1a4fC4dBaE93B3bCCD'],
    },
  },
  {
    name: 'Curve',
    category: 'defi',
    launchTimestamp: 1596240000, // Aug 2020
    contracts: {
      // Router NG on all chains; 3pool on Ethereum
      1: [
        '0x16C6521Dff6baB339122a0FE25a9116693265353',
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
      ],
      42161: ['0x2191718CD32d02B8E60BAdFFeA33E4B5DD9A0A0D'],
      10: ['0x0DCDED3545D565bA3B19E683431381007245d983'],
      8453: ['0x4f37A9d177470499A2dD084621020b023fcffc1F'],
      324: ['0x7C915390e109CA66934f1eB285854375D1B127FA'],
      137: ['0x0DCDED3545D565bA3B19E683431381007245d983'],
    },
  },
  {
    name: '1inch',
    category: 'defi',
    launchTimestamp: 1607904000, // Dec 2020
    contracts: {
      // AggregationRouterV6 — same CREATE2 address on all EVM chains except zkSync
      1: ['0x111111125421cA6dc452d289314280a0f8842A65'],
      42161: ['0x111111125421cA6dc452d289314280a0f8842A65'],
      10: ['0x111111125421cA6dc452d289314280a0f8842A65'],
      8453: ['0x111111125421cA6dc452d289314280a0f8842A65'],
      324: ['0x6fd4383cB451173D5f9304F041C7BCBf27d561fF'],
      137: ['0x111111125421cA6dc452d289314280a0f8842A65'],
    },
  },
  {
    name: 'SushiSwap',
    category: 'defi',
    launchTimestamp: 1598918400, // Aug 2020
    contracts: {
      // V2 Router
      1: ['0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'],
      42161: ['0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'],
      10: ['0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'],
      137: ['0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'],
    },
  },
  {
    name: 'Balancer',
    category: 'defi',
    launchTimestamp: 1583020800, // Mar 2020
    contracts: {
      // V2 Vault — same address on all supported chains
      1: ['0xBA12222222228d8Ba445958a75a0704d566BF2C8'],
      42161: ['0xBA12222222228d8Ba445958a75a0704d566BF2C8'],
      10: ['0xBA12222222228d8Ba445958a75a0704d566BF2C8'],
      8453: ['0xBA12222222228d8Ba445958a75a0704d566BF2C8'],
      137: ['0xBA12222222228d8Ba445958a75a0704d566BF2C8'],
    },
  },
  {
    name: 'MakerDAO',
    category: 'defi',
    launchTimestamp: 1509494400, // Nov 2017
    contracts: {
      // DAI token + Pot (DSR)
      1: [
        '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        '0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7',
      ],
    },
  },
  {
    name: 'GMX',
    category: 'defi',
    launchTimestamp: 1630454400, // Sep 2021
    contracts: {
      // V1 Router
      42161: ['0xaBBc5F99639c9B6bCb58544dDF04EFA6802F4064'],
    },
  },
  {
    name: 'ENS',
    category: 'social',
    launchTimestamp: 1493596800, // May 2017
    contracts: {
      // Base Registrar + ETH Registrar Controller
      1: [
        '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
        '0x253553366Da8546fC250F225fe3d25d0C782303b',
      ],
    },
  },
  {
    name: 'Lens Protocol',
    category: 'social',
    launchTimestamp: 1643673600, // Feb 2022
    contracts: {
      // LensHub Proxy
      137: ['0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d'],
    },
  },
  {
    name: 'Farcaster',
    category: 'social',
    launchTimestamp: 1640995200, // Jan 2022
    contracts: {
      // IdRegistry
      10: ['0x00000000Fc6c5F01Fc30151999387Bb99A9f489b'],
    },
  },
  {
    name: 'Safe',
    category: 'governance',
    launchTimestamp: 1530403200, // Jul 2018
    contracts: {
      // SafeProxyFactory
      1: ['0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2'],
    },
  },
  {
    name: 'Chainlink',
    category: 'infrastructure',
    launchTimestamp: 1559347200, // Jun 2019
    contracts: {
      // LINK token per chain + Feed Registry on Ethereum
      1: [
        '0x514910771AF9Ca656af840dff83E8264EcF986CA',
        '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf',
      ],
      42161: ['0xf97f4df75117a78c1A5a0DBb814Af92458539FB4'],
      10: ['0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6'],
      8453: ['0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196'],
      324: ['0x23A1aFD896c8c8876AF46aDc38521f4432658d1e'],
      137: ['0xb0897686c545045aFc77CF20eC7A532E3120E0F1'],
    },
  },
  {
    name: 'The Graph',
    category: 'infrastructure',
    launchTimestamp: 1607904000, // Dec 2020
    contracts: {
      // GRT token + L2 Staking on Arbitrum
      1: ['0xc944E90C64B2c07662A292be6244BDf05Cda44a7'],
      42161: [
        '0x9623063377AD1B27544C965cCd7342f7EA7e88C7',
        '0x00669A4CF01450B64E8A2A20E9b1FCB71E61eF03',
      ],
    },
  },
  {
    name: 'Treasure',
    category: 'gaming',
    launchTimestamp: 1630454400, // Sep 2021
    contracts: {
      // MagicSwap Router
      42161: ['0x539bde0d7dbd336b79148aa742883198bbf60342'],
    },
  },
  {
    name: 'Aavegotchi',
    category: 'gaming',
    launchTimestamp: 1614556800, // Mar 2021
    contracts: {
      // Diamond
      137: ['0x86935f11c86623dec8a25696e1c19a8659cbf95d'],
    },
  },
  {
    name: 'Deterministic Deployment Proxy',
    category: 'builder-tools',
    launchTimestamp: 1585699200, // Apr 2020
    contracts: {
      1: ['0x4e59b44847b379578588920ca78fbf26c0b4956c'],
      42161: ['0x4e59b44847b379578588920ca78fbf26c0b4956c'],
      10: ['0x4e59b44847b379578588920ca78fbf26c0b4956c'],
      8453: ['0x4e59b44847b379578588920ca78fbf26c0b4956c'],
      324: ['0x4e59b44847b379578588920ca78fbf26c0b4956c'],
      137: ['0x4e59b44847b379578588920ca78fbf26c0b4956c'],
    },
  },
  {
    name: 'CREATE2 Factory',
    category: 'builder-tools',
    launchTimestamp: 1609459200, // Jan 2021
    contracts: {
      1: ['0x13b0d85ccb8bf860b6b79af3029fca081ae9bef2'],
      42161: ['0x13b0d85ccb8bf860b6b79af3029fca081ae9bef2'],
      10: ['0x13b0d85ccb8bf860b6b79af3029fca081ae9bef2'],
      8453: ['0x13b0d85ccb8bf860b6b79af3029fca081ae9bef2'],
      324: ['0x13b0d85ccb8bf860b6b79af3029fca081ae9bef2'],
      137: ['0x13b0d85ccb8bf860b6b79af3029fca081ae9bef2'],
    },
  },
  {
    name: 'JediSwap',
    category: 'defi',
    launchTimestamp: 1672531200, // Jan 2023
    contracts: {
      // AMM Router
      [STARKNET_CHAIN_ID]: [
        '0x041fd22b238fa21cfcf5dd45a8548974d8263b3a531a60388411c5e230f97023',
      ],
    },
  },
  {
    name: 'mySwap',
    category: 'defi',
    launchTimestamp: 1664582400, // Oct 2022
    contracts: {
      [STARKNET_CHAIN_ID]: [
        '0x010884171baf1914edc28d7afb619b40a4051cfae78a094a55d230f19e944a28',
      ],
    },
  },
  {
    name: '10KSwap',
    category: 'defi',
    launchTimestamp: 1672531200, // Jan 2023
    contracts: {
      [STARKNET_CHAIN_ID]: [
        '0x07a6f98c03379b9513ca84cca1373ff452a7462a3b61598f0af5bb27ad7f76d1',
      ],
    },
  },
  {
    name: 'Ekubo',
    category: 'defi',
    launchTimestamp: 1688169600, // Jul 2023
    contracts: {
      // Core pool contract
      [STARKNET_CHAIN_ID]: [
        '0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b',
      ],
    },
  },
  {
    name: 'StarkGate',
    category: 'infrastructure',
    launchTimestamp: 1664582400, // Oct 2022
    contracts: {
      // ETH bridge on Starknet
      [STARKNET_CHAIN_ID]: [
        '0x073314940630fd6dcda0d772d4c972c4e0a9946bef9dabf4ef84eda8ef542b82',
      ],
    },
  },
];
