<script lang="ts">
  import { fetchLeaderboard, type LeaderboardResponse } from '$lib/api/client.js';

  let category = $state('overall');
  const categories = [
    'overall',
    'builder',
    'governance',
    'temporal',
    'protocolDiversity',
    'complexity',
  ];

  let data = $state<LeaderboardResponse | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  const isCategory = $derived(category !== 'overall');

  function categoryLabel(cat: string): string {
    return cat.replace(/([A-Z])/g, ' $1').trim();
  }

  function categoryRaw(entry: any): number {
    if (!isCategory || !entry.breakdown?.[category]) return 0;
    return Math.round(entry.breakdown[category].raw);
  }

  async function load(cat: string) {
    loading = true;
    error = null;
    try {
      data = await fetchLeaderboard(cat);
    } catch (e) {
      data = null;
      error = e instanceof Error ? e.message : 'Failed to load leaderboard';
    }
    loading = false;
  }

  $effect(() => {
    load(category);
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Leaderboard</h1>
    {#if data}
      <span class="text-sm text-[var(--color-text-muted)]">
        {data.total.toLocaleString()} wallets
      </span>
    {/if}
  </div>

  <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    {#each categories as cat}
      <button
        class="shrink-0 rounded-lg px-3 py-1.5 text-sm capitalize {category === cat
          ? 'bg-[var(--color-primary)] text-white'
          : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}"
        onclick={() => (category = cat)}
      >
        {categoryLabel(cat)}
      </button>
    {/each}
  </div>

  {#if error}
    <div class="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-center">
      <p class="text-red-400">{error}</p>
      <button
        class="mt-3 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90"
        onclick={() => load(category)}
      >
        Retry
      </button>
    </div>
  {:else}
    <div
      class="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <table class="w-full min-w-[480px]">
        <thead>
          <tr
            class="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-muted)]"
          >
            <th class="px-4 py-3">Rank</th>
            <th class="px-4 py-3">Address</th>
            <th class="px-4 py-3">Score</th>
            {#if isCategory}
              <th class="px-4 py-3 capitalize">{categoryLabel(category)}</th>
            {/if}
            <th class="px-4 py-3">Sybil</th>
          </tr>
        </thead>
        <tbody>
          {#if loading}
            {#each Array(5) as _}
              <tr class="border-t border-[var(--color-border)]">
                <td class="px-4 py-3"><div class="h-4 w-6 animate-pulse rounded bg-[var(--color-bg)]"></div></td>
                <td class="px-4 py-3"><div class="h-4 w-32 animate-pulse rounded bg-[var(--color-bg)]"></div></td>
                <td class="px-4 py-3"><div class="h-4 w-10 animate-pulse rounded bg-[var(--color-bg)]"></div></td>
                {#if isCategory}
                  <td class="px-4 py-3"><div class="h-4 w-10 animate-pulse rounded bg-[var(--color-bg)]"></div></td>
                {/if}
                <td class="px-4 py-3"><div class="h-4 w-10 animate-pulse rounded bg-[var(--color-bg)]"></div></td>
              </tr>
            {/each}
          {:else if !data || data.entries.length === 0}
            <tr>
              <td colspan={isCategory ? 5 : 4} class="px-4 py-8 text-center text-[var(--color-text-muted)]">
                No leaderboard data yet.
              </td>
            </tr>
          {:else}
            {#each data.entries as entry, i}
              <tr class="border-t border-[var(--color-border)] hover:bg-[var(--color-bg)]">
                <td class="px-4 py-3 text-[var(--color-text-muted)]">
                  {(data.offset ?? 0) + i + 1}
                </td>
                <td class="px-4 py-3">
                  <a
                    href="/score/{entry.address}"
                    class="font-mono text-sm text-[var(--color-primary)] hover:underline"
                  >
                    {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                  </a>
                </td>
                <td class="px-4 py-3">
                  <span class="font-semibold">{Math.round(entry.score)}</span>
                  <div class="mt-1 h-[3px] w-full max-w-[80px] rounded-full bg-[var(--color-bg)]">
                    <div
                      class="h-full rounded-full bg-[var(--color-primary)]"
                      style="width: {(entry.score / 1000) * 100}%"
                    ></div>
                  </div>
                </td>
                {#if isCategory}
                  <td class="px-4 py-3 text-sm text-[var(--color-accent)]">
                    {categoryRaw(entry)} / 1000
                  </td>
                {/if}
                <td class="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                  {(entry.sybilMultiplier * 100).toFixed(0)}%
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>
