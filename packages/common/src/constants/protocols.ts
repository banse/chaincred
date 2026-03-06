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
      // V1 Factory + V2 Router (legacy contracts for early adoption)
      1: [
        '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95', // V1 Factory
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // V2 Router
      ],
      137: ['0xedf6066a2b290C185783862C7F4776A2C8077AD1'],
    },
  },
  {
    name: 'Uniswap V3',
    category: 'defi',
    launchTimestamp: 1620086400, // May 2021 — concentrated liquidity
    contracts: {
      // V3 SwapRouter02 + UniversalRouter (genuinely new: concentrated liquidity pools)
      1: [
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
      // V1 LendingPool (legacy for early adoption)
      1: ['0x398eC7346DcD622eDc5ae82352F02bE94C62d119'],
    },
  },
  {
    name: 'Aave V3',
    category: 'defi',
    launchTimestamp: 1647302400, // Mar 2022 — isolation mode, e-mode, portals
    contracts: {
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
      // V1 Money Market + V2 Comptroller (legacy for early adoption)
      1: [
        '0x3FDA67f7583380E67ef93072294a7fAc882FD7E7', // V1 Money Market
        '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', // V2 Comptroller
      ],
    },
  },
  {
    name: 'Compound V3',
    category: 'defi',
    launchTimestamp: 1661990400, // Sep 2022 — single-asset Comet
    contracts: {
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
    launchTimestamp: 1579564800, // Jan 2020 (first pool: sUSD)
    contracts: {
      // sUSD pool (legacy) + stETH/ETH pool + 3pool + Router NG
      1: [
        '0xA5407eAE9Ba41422680e2e00537571bcC53efBfD', // sUSD pool (legacy, Jan 2020)
        '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022', // stETH/ETH pool
        '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7', // 3pool
        '0x16C6521Dff6baB339122a0FE25a9116693265353', // Router NG
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
    launchTimestamp: 1577836800, // Jan 2020 (V1 aggregator)
    contracts: {
      // V2 + V3 (legacy) + V6 current
      1: [
        '0x111111125434b319222CdBf8C261674aDB56F3ae', // V2 (legacy)
        '0x11111112542D85B3EF69AE05771c2dCCff4fAa26', // V3 (legacy)
        '0x111111125421cA6dc452d289314280a0f8842A65', // V6
      ],
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
      // V1 BFactory (legacy) + V2 Vault
      1: [
        '0x9424B1412450D0f8Fc2255FAf6046b98213B76Bd', // V1 BFactory (legacy)
        '0xBA12222222228d8Ba445958a75a0704d566BF2C8', // V2 Vault
      ],
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
      // SAI (Single-Collateral DAI) + SaiTub (legacy) + MCD DAI + DSR Pot
      1: [
        '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359', // SAI token (legacy)
        '0x448a5065aeBB8E423F0896E6c5D525C040f59af3', // SaiTub CDP engine (legacy)
        '0x6B175474E89094C44Da98b954EedeAC495271d0F', // MCD DAI
        '0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7', // Pot (DSR)
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
      // Old Auction Registrar (legacy) + Registry + Base Registrar + ETH Registrar Controller
      1: [
        '0x6090A6e47849629b7245Dfa1Ca21D94cd15878Ef', // Old auction registrar (legacy)
        '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', // ENS Registry
        '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85', // Base Registrar
        '0x253553366Da8546fC250F225fe3d25d0C782303b', // ETH Registrar Controller
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
      // GnosisSafe V1 Mastercopy (legacy) + SafeProxyFactory V1.3
      1: [
        '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552', // GnosisSafe V1.3 mastercopy
        '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2', // SafeProxyFactory
      ],
    },
  },
  {
    name: 'OpenZeppelin Governor',
    category: 'governance',
    launchTimestamp: 1617235200, // Apr 2021 (OZ Gov v4.3)
    contracts: {
      1: [
        '0x408ed6354d4973f66138c91495f2f2fcbd8724c3', // Uniswap
        '0x323a76393544d5ecca80cd6ef2a560c6a395b7e3', // ENS
        '0x6f3e6272a167e8accb32072d08e0957f9c79223d', // Nouns
        '0xdd1492570beb290a2f309541e1fddeb9ac484a65', // Nouns V3
        '0xdbd27635a534a3d3169ef0498beb56fb9c937489', // Gitcoin
        '0xed8bdb5895b8b7f9fdb3c087628fd8389bfce8ec', // Hop
      ],
      42161: [
        '0xf07ded9dc292157749b6fd268e37df6ea38395b9', // Arbitrum Core
        '0x789fc99093b09ad01c34dc7251d0c89ce743e5a4', // Arbitrum Treasury
      ],
      10: [
        '0xcdf27f107725988f2261ce2256bdfcde8b382b10', // Optimism
      ],
    },
  },
  {
    name: 'Compound Governor',
    category: 'governance',
    launchTimestamp: 1535760000, // Sep 2018
    contracts: {
      1: [
        '0xc0da02939e1441f497fd74f78ce7decb17b66529', // Compound Bravo
        '0xc0da01a04c3f3e0be433606045bb7017a7323e38', // Compound Delegator
        '0xec568fffba86c094cf06b22134b23074dfe2252c', // Aave Gov V2
        '0x9aee0b04504cef83a65ac3f0e838d0593bcb2bc7', // Aave Gov V3
      ],
    },
  },
  {
    name: 'Aragon',
    category: 'governance',
    launchTimestamp: 1510531200, // Nov 2017
    contracts: {
      1: [
        '0x2e59a20f205bb85a89c53f1936454680651e618e', // Lido DAO (Aragon)
      ],
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
    name: 'FrenPet',
    category: 'gaming',
    launchTimestamp: 1691020800, // Aug 2023
    contracts: {
      // Diamond Proxy (V2), V1 Main Contract, V1 Game Manager, FP Token, pGOLD Token, NFT
      8453: [
        '0x0e22b5f3e11944578b37ed04f5312dfc246f443c',
        '0x85b157EbaAF289De5301aE6694B651BF3b8df1C3',
        '0x773565aadf59f07f6d72f1e1e2a489cffe96b1e9',
        '0xff0c532fdb8cd566ae169c1cb157ff2bdc83e105',
        '0x976008031bBc99E05D006f68C7Ea723c2b56101f',
        '0x5b51Cf49Cb48617084eF35e7c7d7A21914769ff1',
      ],
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
    name: 'WETH',
    category: 'defi',
    launchTimestamp: 1513728000, // Dec 2017
    contracts: {
      // Canonical WETH9 on Ethereum + L2s
      1: ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'],
      42161: ['0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'],
      10: ['0x4200000000000000000000000000000000000006'],
      8453: ['0x4200000000000000000000000000000000000006'],
      324: ['0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91'],
      137: ['0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'],
    },
  },
  {
    name: 'OpenSea',
    category: 'defi',
    launchTimestamp: 1514332800, // Dec 2017
    contracts: {
      // Wyvern V1 + V2 (legacy) + Seaport 1.5 + 1.6
      1: [
        '0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b', // Wyvern V1 (legacy)
        '0x7f268357A8c2552623316e2562D90e642bB538E5', // Wyvern V2 (legacy)
        '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC', // Seaport 1.5
        '0x0000000000000068F116a894984e2DB1123eB395', // Seaport 1.6
      ],
      42161: ['0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC'],
      10: ['0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC'],
      8453: ['0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC'],
      137: ['0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC'],
    },
  },
  {
    name: 'Gitcoin',
    category: 'social',
    launchTimestamp: 1536364800, // Sep 2018
    contracts: {
      // Gitcoin Grants: Allo V2 Registry + BulkCheckout
      1: [
        '0x4AAcca72145e1dF2aeC137E1f3C5E3D75DB8b5f3',
        '0x7d655c57f71464B6f83811C55D84009Cd9f5221C',
      ],
    },
  },
  {
    name: 'EigenLayer',
    category: 'infrastructure',
    launchTimestamp: 1686614400, // Jun 2023
    contracts: {
      // StrategyManager + DelegationManager
      1: [
        '0x858646372CC42E1A627fcE94aa7A7033e7CF075A',
        '0x39053D51B77DC0d36036Fc1fCc8Cb819df8Ef37A',
      ],
    },
  },
  {
    name: 'Rocket Pool',
    category: 'defi',
    launchTimestamp: 1635724800, // Nov 2021
    contracts: {
      // rETH token + Deposit Pool
      1: [
        '0xae78736Cd615f374D3085123A210448E74Fc6393',
        '0xDD3f50F8A6CafbE9b31a427582963f465E745AF8',
      ],
    },
  },
  {
    name: 'Across Bridge',
    category: 'infrastructure',
    launchTimestamp: 1636934400, // Nov 2021
    contracts: {
      // SpokePool on each chain
      1: ['0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5'],
      42161: ['0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A'],
      10: ['0x6f26Bf09B1C792e3228e5467807a900A503c0281'],
      8453: ['0x09aea4b2242abC8bb4BB78D537A67a245A7bEC64'],
      137: ['0x9295ee1d8C5b022Be115A2AD3c30C72E34e7F096'],
    },
  },
  {
    name: 'Stargate',
    category: 'infrastructure',
    launchTimestamp: 1647302400, // Mar 2022
    contracts: {
      // Router V2
      1: ['0x8731d54E9D02c286767d56ac03e8037C07e01e98'],
      42161: ['0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614'],
      10: ['0xB0D502E938ed5f4df2E681fE6E419ff29631d62b'],
      8453: ['0x45f1A95A4D3f3836523F5c83673c797f4d4d263B'],
      137: ['0x45A01E4e04F14f7A4a6702c74187c5F6222033cd'],
    },
  },
  {
    name: 'Zora',
    category: 'social',
    launchTimestamp: 1619827200, // May 2021
    contracts: {
      // ERC1155 Minter + ZoraCreator1155
      1: [
        '0x04E2516A2c207E84a1839755675dfd8eF6302F0a',
        '0x777777C338d93e2C7adf08D102d45CA7CC4Ed021',
      ],
      8453: ['0x777777C338d93e2C7adf08D102d45CA7CC4Ed021'],
      10: ['0x777777C338d93e2C7adf08D102d45CA7CC4Ed021'],
    },
  },
  {
    name: 'Pendle',
    category: 'defi',
    launchTimestamp: 1624406400, // Jun 2021
    contracts: {
      // PendleRouter V4
      1: ['0x888888888889758F76e7103c6CbF23ABbF58F946'],
      42161: ['0x888888888889758F76e7103c6CbF23ABbF58F946'],
    },
  },
  {
    name: 'Morpho',
    category: 'defi',
    launchTimestamp: 1656633600, // Jul 2022
    contracts: {
      // Morpho Blue
      1: ['0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb'],
      8453: ['0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb'],
    },
  },
  {
    name: 'Permit2',
    category: 'infrastructure',
    launchTimestamp: 1668556800, // Nov 2022
    contracts: {
      // Universal Permit2 — same CREATE2 address on all chains
      1: ['0x000000000022D473030F116dDEE9F6B43aC78BA3'],
      42161: ['0x000000000022D473030F116dDEE9F6B43aC78BA3'],
      10: ['0x000000000022D473030F116dDEE9F6B43aC78BA3'],
      8453: ['0x000000000022D473030F116dDEE9F6B43aC78BA3'],
      324: ['0x000000000022D473030F116dDEE9F6B43aC78BA3'],
      137: ['0x000000000022D473030F116dDEE9F6B43aC78BA3'],
    },
  },
  {
    name: 'Cowswap',
    category: 'defi',
    launchTimestamp: 1616457600, // Mar 2021
    contracts: {
      // GPv2Settlement
      1: ['0x9008D19f58AAbD9eD0D60971565AA8510560ab41'],
      42161: ['0x9008D19f58AAbD9eD0D60971565AA8510560ab41'],
      8453: ['0x9008D19f58AAbD9eD0D60971565AA8510560ab41'],
    },
  },
  {
    name: 'Hop Protocol',
    category: 'infrastructure',
    launchTimestamp: 1625616000, // Jul 2021
    contracts: {
      // ETH Bridge
      1: ['0xb8901acB165ed027E32754E0FFe830802919727f'],
      42161: ['0x33ceb27b39d2Bb7D2b25f7A34a748dB826B31e6d'],
      10: ['0x86cA30bEF97fB651b8d866D45503684b90cb3312'],
      137: ['0xb98454270065A31D71Bf635F6F7Ee6A518dFb849'],
    },
  },
  {
    name: 'Yearn',
    category: 'defi',
    launchTimestamp: 1581984000, // Feb 2020
    contracts: {
      // V1 yDAI vault (legacy) + V2 Registry + V3 Router
      1: [
        '0xACd43E627e64355f1861cEC6d3a6688B31a6F952', // V1 yDAI (legacy)
        '0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804', // V2 Registry
        '0x1ab62413e0cf2571E90Ce4F2E5B3e55a4C6e03B8', // V3 Router
      ],
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
