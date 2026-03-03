<script lang="ts">
  let category = $state('overall');
  const categories = ['overall', 'builder', 'governance', 'temporal', 'protocolDiversity', 'complexity'];

  let entries = $state<any[]>([]);
</script>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">Leaderboard</h1>

  <div class="flex gap-2">
    {#each categories as cat}
      <button
        class="rounded-lg px-3 py-1.5 text-sm capitalize {category === cat
          ? 'bg-[var(--color-primary)] text-white'
          : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}"
        onclick={() => (category = cat)}
      >
        {cat.replace(/([A-Z])/g, ' $1').trim()}
      </button>
    {/each}
  </div>

  <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
    <table class="w-full">
      <thead>
        <tr class="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-muted)]">
          <th class="px-4 py-3">Rank</th>
          <th class="px-4 py-3">Address</th>
          <th class="px-4 py-3">Score</th>
          <th class="px-4 py-3">Badges</th>
        </tr>
      </thead>
      <tbody>
        {#if entries.length === 0}
          <tr>
            <td colspan="4" class="px-4 py-8 text-center text-[var(--color-text-muted)]">
              No leaderboard data yet.
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>
