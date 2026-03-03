<script lang="ts">
  import { BADGE_DEFINITIONS } from '@chaincred/common';

  let { address }: { address: string } = $props();

  // Placeholder — in production, fetch from API
  const earnedBadges = BADGE_DEFINITIONS.slice(0, 2);
</script>

<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
  <h2 class="text-lg font-semibold text-[var(--color-text-muted)]">Badges</h2>
  <div class="mt-4 flex flex-wrap gap-3">
    {#each BADGE_DEFINITIONS as badge}
      <div
        class="rounded-lg border px-3 py-2 text-sm {earnedBadges.includes(badge)
          ? 'border-current opacity-100'
          : 'border-[var(--color-border)] opacity-40'}"
        style="color: {badge.color}"
      >
        <span class="mr-1">{badge.emoji}</span>
        {badge.label}
      </div>
    {/each}
  </div>
</div>
