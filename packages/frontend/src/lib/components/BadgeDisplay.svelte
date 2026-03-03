<script lang="ts">
  import { BADGE_DEFINITIONS } from '@chaincred/common';
  import type { Badge } from '@chaincred/common';
  import { fetchBadges } from '$lib/api/client.js';

  let { address }: { address: string } = $props();

  let badges = $state<Badge[]>([]);
  let loaded = $state(false);

  $effect(() => {
    if (!address) return;
    fetchBadges(address)
      .then((data) => (badges = data.badges))
      .catch(() => (badges = []))
      .finally(() => (loaded = true));
  });

  function isEarned(type: string): boolean {
    return badges.some((b) => b.type === type && b.earned);
  }
</script>

<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
  <h2 class="text-lg font-semibold text-[var(--color-text-muted)]">Badges</h2>
  {#if !loaded}
    <p class="mt-4 text-sm text-[var(--color-text-muted)]">Loading badges...</p>
  {:else}
    <div class="mt-4 flex flex-wrap gap-3">
      {#each BADGE_DEFINITIONS as badge}
        <div
          class="rounded-lg border px-3 py-2 text-sm {isEarned(badge.type)
            ? 'border-current opacity-100'
            : 'border-[var(--color-border)] opacity-40'}"
          style="color: {badge.color}"
        >
          <span class="mr-1">{badge.emoji}</span>
          {badge.label}
        </div>
      {/each}
    </div>
  {/if}
</div>
