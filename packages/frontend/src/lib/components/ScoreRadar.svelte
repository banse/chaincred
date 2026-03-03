<script lang="ts">
  import type { ScoreBreakdown } from '@chaincred/common';

  let { breakdown }: { breakdown: ScoreBreakdown } = $props();

  const categories = [
    { key: 'builder', label: 'Builder', color: '#F97316' },
    { key: 'governance', label: 'Governance', color: '#A855F7' },
    { key: 'temporal', label: 'Temporal', color: '#22D3EE' },
    { key: 'protocolDiversity', label: 'Diversity', color: '#10B981' },
    { key: 'complexity', label: 'Complexity', color: '#EF4444' },
  ] as const;
</script>

<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
  <h2 class="text-lg font-semibold text-[var(--color-text-muted)]">Score Breakdown</h2>
  <div class="mt-4 space-y-3">
    {#each categories as cat}
      {@const score = breakdown[cat.key]}
      <div>
        <div class="flex justify-between text-sm">
          <span>{cat.label}</span>
          <span class="text-[var(--color-text-muted)]">{Math.round(score.raw)} / 1000</span>
        </div>
        <div class="mt-1 h-2 rounded-full bg-[var(--color-bg)]">
          <div
            class="h-full rounded-full"
            style="width: {(score.raw / 1000) * 100}%; background-color: {cat.color}"
          ></div>
        </div>
      </div>
    {/each}
  </div>
</div>
