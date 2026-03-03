<script lang="ts">
  import '../app.css';
  import WalletConnect from '$lib/components/WalletConnect.svelte';
  let { children } = $props();
</script>

<div class="min-h-screen bg-[var(--color-bg)]">
  <nav class="border-b border-[var(--color-border)] px-4 py-3 sm:px-6 sm:py-4">
    <div class="mx-auto flex max-w-6xl items-center justify-between">
      <a href="/" class="text-lg font-bold text-[var(--color-primary)] sm:text-xl">ChainCred</a>
      <div class="flex items-center gap-3 sm:gap-4">
        <a
          href="/leaderboard"
          class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          Leaderboard
        </a>
        <WalletConnect />
      </div>
    </div>
  </nav>
  <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
    {@render children()}
  </main>
</div>
