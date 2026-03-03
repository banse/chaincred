import { writable } from 'svelte/store';

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
}

export const wallet = writable<WalletState>({
  connected: false,
  address: null,
  chainId: null,
});

export async function connectWallet() {
  // TODO: Implement with wagmi/viem
  console.log('Wallet connection not yet implemented');
}

export async function disconnectWallet() {
  wallet.set({ connected: false, address: null, chainId: null });
}
