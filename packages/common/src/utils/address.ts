import { getAddress, isAddress } from 'viem';

export function normalizeAddress(address: string): `0x${string}` {
  return getAddress(address) as `0x${string}`;
}

export function isValidAddress(address: string): boolean {
  return isAddress(address);
}

export function shortenAddress(address: string, chars = 4): string {
  const normalized = normalizeAddress(address);
  return `${normalized.slice(0, chars + 2)}...${normalized.slice(-chars)}`;
}
