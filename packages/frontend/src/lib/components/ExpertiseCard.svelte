<script lang="ts">
  import type { WalletScore } from '@chaincred/common';

  let { score }: { score: WalletScore } = $props();
</script>

<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
  <h2 class="text-lg font-semibold text-[var(--color-text-muted)]">Expertise Score</h2>
  <p class="mt-2 text-6xl font-bold text-[var(--color-primary)]">{Math.round(score.totalScore)}</p>
  <p class="mt-1 text-sm text-[var(--color-text-muted)]">out of 1000</p>
  <div class="mt-4 h-2 rounded-full bg-[var(--color-bg)]">
    <div
      class="h-full rounded-full bg-[var(--color-primary)]"
      style="width: {(score.totalScore / 1000) * 100}%"
    ></div>
  </div>
</div>
