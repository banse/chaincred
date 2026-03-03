<script lang="ts">
  import { wallet, connectWallet, disconnectWallet } from '$lib/stores/wallet.js';
</script>

{#if $wallet.connected}
  <div class="flex items-center gap-2">
    <span class="text-sm text-[var(--color-text-muted)]">
      {$wallet.address?.slice(0, 6)}...{$wallet.address?.slice(-4)}
    </span>
    <button
      onclick={disconnectWallet}
      class="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-surface)]"
    >
      Disconnect
    </button>
  </div>
{:else}
  <button
    onclick={connectWallet}
    class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
  >
    Connect Wallet
  </button>
{/if}
