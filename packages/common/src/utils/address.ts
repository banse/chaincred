import { getAddress, isAddress } from 'viem';

export function normalizeAddress(address: string): `0x${string}` {
  return getAddress(address) as `0x${string}`;
}

/** Validates an EVM address (0x + 40 hex chars) */
export function isValidEvmAddress(address: string): boolean {
  return isAddress(address);
}

/** Validates a Starknet address (0x-prefixed, up to 66 chars = 0x + 64 hex for felt252) */
export function isValidStarknetAddress(address: string): boolean {
  if (!address.startsWith('0x')) return false;
  const hex = address.slice(2);
  if (hex.length === 0 || hex.length > 64) return false;
  return /^[0-9a-fA-F]+$/.test(hex);
}

/** Normalizes a Starknet address to 0x + 64 lowercase hex chars */
export function normalizeStarknetAddress(address: string): string {
  const hex = address.slice(2).toLowerCase();
  return '0x' + hex.padStart(64, '0');
}

/** Validates either an EVM or Starknet address */
export function isValidAddress(address: string): boolean {
  return isValidEvmAddress(address) || isValidStarknetAddress(address);
}

export function shortenAddress(address: string, chars = 4): string {
  if (isValidEvmAddress(address)) {
    const normalized = normalizeAddress(address);
    return `${normalized.slice(0, chars + 2)}...${normalized.slice(-chars)}`;
  }
  // Starknet or other long-form addresses
  const normalized = address.toLowerCase();
  return `${normalized.slice(0, chars + 2)}...${normalized.slice(-chars)}`;
}
