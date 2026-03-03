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
}

/** Starter protocol registry — expanded at runtime */
export const PROTOCOL_REGISTRY: ProtocolDefinition[] = [
  {
    name: 'Uniswap',
    category: 'defi',
    contracts: {
      1: ['0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'],
    },
  },
  {
    name: 'Aave',
    category: 'defi',
    contracts: {
      1: ['0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'],
    },
  },
  {
    name: 'ENS',
    category: 'social',
    contracts: {
      1: ['0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85'],
    },
  },
  {
    name: 'Safe',
    category: 'governance',
    contracts: {
      1: ['0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2'],
    },
  },
];
