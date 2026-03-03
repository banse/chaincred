<script lang="ts">
  import { page } from '$app/stores';
  import ExpertiseCard from '$lib/components/ExpertiseCard.svelte';
  import ScoreRadar from '$lib/components/ScoreRadar.svelte';
  import BadgeDisplay from '$lib/components/BadgeDisplay.svelte';
  import SybilIndicator from '$lib/components/SybilIndicator.svelte';
  import { fetchScore } from '$lib/api/client.js';

  const address = $derived($page.params.address ?? '');
  let scoreData = $state<any>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function loadScore(addr: string) {
    loading = true;
    error = null;
    try {
      scoreData = await fetchScore(addr);
    } catch (e) {
      scoreData = null;
      error = e instanceof Error ? e.message : 'Failed to load score';
    }
    loading = false;
  }

  $effect(() => {
    if (!address) return;
    loadScore(address);
  });
</script>

<div class="space-y-8">
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
    <h1 class="text-2xl font-bold">Wallet Score</h1>
    <code
      class="truncate rounded bg-[var(--color-surface)] px-3 py-1 text-sm text-[var(--color-text-muted)]"
    >
      {address}
    </code>
  </div>

  {#if loading}
    <div class="grid gap-8 lg:grid-cols-2">
      {#each [0, 1] as _}
        <div class="h-48 animate-pulse rounded-xl bg-[var(--color-surface)]"></div>
      {/each}
    </div>
    <div class="grid gap-8 lg:grid-cols-2">
      {#each [0, 1] as _}
        <div class="h-48 animate-pulse rounded-xl bg-[var(--color-surface)]"></div>
      {/each}
    </div>
  {:else if error}
    <div class="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-12 text-center">
      <p class="text-red-400">{error}</p>
      <button
        class="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90"
        onclick={() => loadScore(address)}
      >
        Retry
      </button>
    </div>
  {:else if scoreData}
    <div class="grid gap-8 lg:grid-cols-2">
      <ExpertiseCard score={scoreData} {address} />
      <ScoreRadar breakdown={scoreData.breakdown} />
    </div>
    <div class="grid gap-8 lg:grid-cols-2">
      <BadgeDisplay {address} />
      <SybilIndicator {address} />
    </div>
  {:else}
    <div class="py-20 text-center text-[var(--color-text-muted)]">
      No score data found for this wallet.
    </div>
  {/if}
</div>
