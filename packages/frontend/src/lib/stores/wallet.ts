import { writable } from 'svelte/store';
import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { mainnet } from 'viem/chains';

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

function getEthereum(): any | null {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  return null;
}

export async function connectWallet() {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error('No wallet detected. Please install MetaMask or another browser wallet.');
  }

  const walletClient = createWalletClient({
    transport: custom(ethereum),
  });

  const [address] = await walletClient.requestAddresses();
  const chainId = await walletClient.getChainId();

  wallet.set({ connected: true, address, chainId });

  ethereum.on('accountsChanged', (accounts: string[]) => {
    if (accounts.length === 0) {
      wallet.set({ connected: false, address: null, chainId: null });
    } else {
      wallet.update((s) => ({ ...s, address: accounts[0] }));
    }
  });

  ethereum.on('chainChanged', (newChainId: string) => {
    wallet.update((s) => ({ ...s, chainId: parseInt(newChainId, 16) }));
  });
}

export async function disconnectWallet() {
  wallet.set({ connected: false, address: null, chainId: null });
}

export function getPublicClient() {
  const ethereum = getEthereum();
  if (ethereum) {
    return createPublicClient({ transport: custom(ethereum) });
  }
  return createPublicClient({ chain: mainnet, transport: http() });
}
