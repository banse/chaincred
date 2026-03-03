<script lang="ts">
  import { page } from '$app/stores';
  import ExpertiseCard from '$lib/components/ExpertiseCard.svelte';
  import ScoreRadar from '$lib/components/ScoreRadar.svelte';
  import BadgeDisplay from '$lib/components/BadgeDisplay.svelte';
  import SybilIndicator from '$lib/components/SybilIndicator.svelte';
  import { fetchScore, fetchTimeline, type TimelineEvent } from '$lib/api/client.js';

  const address = $derived($page.params.address ?? '');
  let scoreData = $state<any>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let timelineEvents = $state<TimelineEvent[]>([]);

  const typeLabels: Record<string, string> = {
    first_tx: 'First Transaction',
    first_deployment: 'First Deployment',
    first_governance: 'First Governance',
    chain_added: 'Chain Added',
    badge_earned: 'Badge Earned',
  };

  function formatDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

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
    // Load timeline in parallel (non-critical)
    fetchTimeline(addr)
      .then((res) => {
        timelineEvents = res.events;
      })
      .catch(() => {
        timelineEvents = [];
      });
  }

  $effect(() => {
    if (!address) return;
    loadScore(address);
  });
</script>

<svelte:head>
  {#if address}
    {@const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1'}
    {@const cardUrl = `${apiBase}/card/${address}.png`}
    {@const pageUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/score/${address}`}
    <meta property="og:title" content="ChainCred Score — {address.slice(0, 6)}...{address.slice(-4)}" />
    <meta property="og:image" content={cardUrl} />
    <meta property="og:url" content={pageUrl} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={cardUrl} />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content={cardUrl} />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:button:1" content="View Score" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content={pageUrl} />
    <meta property="fc:frame:input:text" content="Enter an Ethereum address" />
    <meta property="fc:frame:button:2" content="Look Up" />
    <meta property="fc:frame:button:2:action" content="post" />
    <meta property="fc:frame:post_url" content={`${apiBase}/frame`} />
  {/if}
</svelte:head>

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

  {#if timelineEvents.length > 0}
    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 class="mb-4 text-lg font-semibold">Activity Timeline</h2>
      <div class="relative ml-4 border-l-2 border-[var(--color-border)] pl-6">
        {#each timelineEvents as event}
          <div class="relative mb-6 last:mb-0">
            <div
              class="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-bg)]"
            ></div>
            <p class="text-sm font-medium">
              {typeLabels[event.type] ?? event.type}{event.type === 'badge_earned' && event.detail ? ` — ${event.detail.charAt(0).toUpperCase() + event.detail.slice(1)}` : ''}
            </p>
            <p class="text-xs text-[var(--color-text-muted)]">
              {formatDate(event.timestamp)}{event.chain ? ` on ${event.chain}` : ''}
            </p>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
