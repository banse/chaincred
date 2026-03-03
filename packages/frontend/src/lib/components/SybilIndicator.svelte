<script lang="ts">
  import type { SybilResult } from '@chaincred/common';
  import { fetchSybil } from '$lib/api/client.js';

  let { address }: { address: string } = $props();

  let result = $state<SybilResult | null>(null);
  let loaded = $state(false);

  $effect(() => {
    if (!address) return;
    fetchSybil(address)
      .then((data) => (result = data))
      .catch(() => (result = null))
      .finally(() => (loaded = true));
  });

  let confidence = $derived(result?.confidence ?? 0);
</script>

<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
  <h2 class="text-lg font-semibold text-[var(--color-text-muted)]">Sybil Confidence</h2>
  {#if !loaded}
    <p class="mt-4 text-sm text-[var(--color-text-muted)]">Analyzing...</p>
  {:else if result}
    <div class="mt-4 flex items-end gap-3">
      <p class="text-4xl font-bold" class:text-green-400={confidence > 0.8} class:text-yellow-400={confidence > 0.5 && confidence <= 0.8} class:text-red-400={confidence <= 0.5}>
        {(confidence * 100).toFixed(0)}%
      </p>
      <p class="mb-1 text-sm text-[var(--color-text-muted)]">
        {confidence > 0.8 ? 'Likely human' : confidence > 0.5 ? 'Moderate risk' : 'High sybil risk'}
      </p>
    </div>
    <p class="mt-2 text-xs text-[var(--color-text-muted)]">
      Confidence that this wallet represents a unique human user, based on 7 behavioral heuristics.
    </p>
    {#if result.flags.some((f) => f.detected)}
      <div class="mt-4 space-y-2">
        {#each result.flags.filter((f) => f.detected) as flag}
          <div class="rounded-lg bg-[var(--color-bg)] px-3 py-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-[var(--color-text-muted)]">{flag.label}</span>
              <span class="text-red-400">-{(flag.penalty * 100).toFixed(0)}%</span>
            </div>
            {#if flag.details}
              <p class="mt-1 text-xs text-[var(--color-text-muted)] opacity-70">{flag.details}</p>
            {/if}
          </div>
        {/each}
      </div>
    {:else if confidence > 0.95}
      <p class="mt-4 text-sm text-green-400">No concerning patterns detected.</p>
    {/if}
  {:else}
    <p class="mt-4 text-sm text-[var(--color-text-muted)]">No data available.</p>
  {/if}
</div>
