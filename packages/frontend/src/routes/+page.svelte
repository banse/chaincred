<script lang="ts">
  import SearchBar from '$lib/components/SearchBar.svelte';
  import { fetchStats, type StatsResponse } from '$lib/api/client.js';

  let stats = $state<StatsResponse>({ walletsScored: 0, chainsIndexed: 6 });

  $effect(() => {
    fetchStats()
      .then((data) => (stats = data))
      .catch(() => {});
  });
</script>

<div class="flex flex-col items-center gap-8 py-8 sm:gap-12 sm:py-16">
  <div class="text-center">
    <h1 class="text-3xl font-bold tracking-tight sm:text-5xl">
      Your wallet's expertise,
      <span class="text-[var(--color-primary)]">provable</span>.
    </h1>
    <p class="mt-3 text-base text-[var(--color-text-muted)] sm:mt-4 sm:text-lg">
      Onchain reputation scores based on what you do — not what you hold.
    </p>
  </div>

  <SearchBar />

  <div class="grid w-full max-w-md grid-cols-2 gap-4 text-center sm:gap-8">
    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
      <p class="text-2xl font-bold text-[var(--color-accent)] sm:text-3xl">
        {stats.walletsScored.toLocaleString()}
      </p>
      <p class="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">Wallets Scored</p>
    </div>
    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
      <p class="text-2xl font-bold text-[var(--color-accent)] sm:text-3xl">
        {stats.chainsIndexed}
      </p>
      <p class="mt-1 text-xs text-[var(--color-text-muted)] sm:text-sm">Chains Indexed</p>
    </div>
  </div>
</div>
