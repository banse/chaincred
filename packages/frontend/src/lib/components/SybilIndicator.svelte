<script lang="ts">
  let { address }: { address: string } = $props();

  // Placeholder
  let confidence = 0.95;
</script>

<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
  <h2 class="text-lg font-semibold text-[var(--color-text-muted)]">Sybil Confidence</h2>
  <div class="mt-4 flex items-end gap-3">
    <p class="text-4xl font-bold" class:text-green-400={confidence > 0.8} class:text-yellow-400={confidence > 0.5 && confidence <= 0.8} class:text-red-400={confidence <= 0.5}>
      {(confidence * 100).toFixed(0)}%
    </p>
    <p class="mb-1 text-sm text-[var(--color-text-muted)]">
      {confidence > 0.8 ? 'Likely human' : confidence > 0.5 ? 'Moderate risk' : 'High sybil risk'}
    </p>
  </div>
</div>
