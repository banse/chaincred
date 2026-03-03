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

  $effect(() => {
    if (!address) return;
    loading = true;
    fetchScore(address).then((data) => {
      scoreData = data;
      loading = false;
    });
  });
</script>

<div class="space-y-8">
  <div class="flex items-center gap-3">
    <h1 class="text-2xl font-bold">Wallet Score</h1>
    <code class="rounded bg-[var(--color-surface)] px-3 py-1 text-sm text-[var(--color-text-muted)]">
      {address}
    </code>
  </div>

  {#if loading}
    <div class="py-20 text-center text-[var(--color-text-muted)]">Loading score data...</div>
  {:else if scoreData}
    <div class="grid gap-8 lg:grid-cols-2">
      <ExpertiseCard score={scoreData} />
      <ScoreRadar breakdown={scoreData.breakdown} />
    </div>
    <div class="grid gap-8 lg:grid-cols-2">
      <BadgeDisplay {address} />
      <SybilIndicator {address} />
    </div>
  {:else}
    <div class="py-20 text-center text-[var(--color-text-muted)]">No score data found.</div>
  {/if}
</div>
