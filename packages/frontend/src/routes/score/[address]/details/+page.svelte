<script lang="ts">
  import { page } from '$app/stores';
  import { fetchScore, fetchSybil, fetchBadges } from '$lib/api/client.js';
  import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';
  import type { WalletScore, ScoreCategory, SybilResult, WalletBadges } from '@chaincred/common';

  const address = $derived($page.params.address ?? '');
  let scoreData = $state<WalletScore | null>(null);
  let sybilData = $state<SybilResult | null>(null);
  let badgeData = $state<WalletBadges | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  interface Signal {
    name: string;
    desc: string;
    cap: number;
  }

  const categorySignals: Record<ScoreCategory, Signal[]> = {
    builder: [
      { name: 'Contract Deployments', desc: '40 pts each', cap: 280 },
      { name: 'Multi-chain Deploys', desc: '50 pts per chain', cap: 200 },
      { name: 'Constructor Complexity', desc: 'Based on avg calldata size', cap: 100 },
      { name: 'Deployment Focus', desc: 'Deploys / total tx ratio', cap: 80 },
      { name: 'CREATE2 Deployments', desc: '30 pts each', cap: 120 },
      { name: 'ERC-4337 Operations', desc: '25 pts each', cap: 100 },
      { name: 'Deployment Longevity', desc: '30 pts per 6-month period', cap: 90 },
      { name: 'Verified Source', desc: '50 pts per verified deploy', cap: 200 },
      { name: 'Contract Users', desc: '15 pts per unique caller', cap: 150 },
      { name: 'Active Contracts', desc: '40 pts per contract (>6mo)', cap: 200 },
    ],
    governance: [
      { name: 'Governance Votes', desc: '20 pts each', cap: 400 },
      { name: 'DAO Breadth', desc: '60 pts per DAO', cap: 360 },
      { name: 'Proposals Created', desc: '100 pts each', cap: 150 },
      { name: 'Delegation Events', desc: '15 pts each', cap: 90 },
      { name: 'Treasury Executions', desc: '30 pts each', cap: 120 },
      { name: 'Cross-chain Governance', desc: '25 pts per chain', cap: 150 },
      { name: 'Independent Voting', desc: '20 pts each (against/abstain)', cap: 120 },
      { name: 'Safe Multi-sig', desc: '25 pts per execution', cap: 200 },
      { name: 'Reasoned Votes', desc: '25 pts each', cap: 150 },
    ],
    temporal: [
      { name: 'Wallet Age', desc: '50 pts per year', cap: 400 },
      { name: 'Bear Market Activity', desc: '5 pts per tx in bear markets', cap: 300 },
      { name: 'Consistency Ratio', desc: 'Active months / wallet age', cap: 300 },
      { name: 'Activity Entropy', desc: 'Distinct hours of activity / 24', cap: 200 },
      { name: 'Cross-cycle Persistence', desc: '75 pts per bear/bull cycle', cap: 300 },
    ],
    protocolDiversity: [
      { name: 'Unique Protocols', desc: '18 pts each', cap: 350 },
      { name: 'Chain Diversity', desc: '40 pts per chain', cap: 250 },
      { name: 'Cross-domain Coverage', desc: '40 pts per domain (DeFi, social, etc.)', cap: 400 },
      { name: 'Early Adoption', desc: '30 pts per protocol used within 6mo of launch', cap: 300 },
    ],
    complexity: [
      { name: 'Transaction Volume', desc: '1.5 pts each', cap: 300 },
      { name: 'Failed Tx Ratio', desc: 'Failure rate signal', cap: 300 },
      { name: 'Avg Calldata Size', desc: 'Based on calldata complexity', cap: 400 },
      { name: 'EIP-712 Permits', desc: '10 pts each', cap: 200 },
      { name: 'Flashloans', desc: '50 pts each', cap: 300 },
      { name: 'Smart Wallet Interactions', desc: '15 pts each', cap: 150 },
      { name: 'Internal Transactions', desc: 'Based on internal call count', cap: 200 },
    ],
  };

  const categories: { key: ScoreCategory; label: string; color: string; desc: string }[] = [
    {
      key: 'builder',
      label: 'Builder',
      color: '#F97316',
      desc: 'Contract deployments, verified source, factory/proxy patterns',
    },
    {
      key: 'governance',
      label: 'Governance',
      color: '#A855F7',
      desc: 'DAO votes, proposals, multi-sig, delegation',
    },
    {
      key: 'temporal',
      label: 'Temporal',
      color: '#22D3EE',
      desc: 'Wallet age, bear market activity, consistency',
    },
    {
      key: 'protocolDiversity',
      label: 'Protocol Diversity',
      color: '#10B981',
      desc: 'Unique protocols, domain coverage, L2 fluency',
    },
    {
      key: 'complexity',
      label: 'Complexity',
      color: '#EF4444',
      desc: 'Calldata size, internal call depth, flashloans',
    },
  ];

  const badgeEmojis: Record<string, string> = {
    builder: '\u{1F3D7}\u{FE0F}',
    governor: '\u{1F5F3}\u{FE0F}',
    explorer: '\u{1F9EA}',
    og: '\u{26F0}\u{FE0F}',
    multichain: '\u{1F310}',
    trusted: '\u{1F510}',
    'power-user': '\u{26A1}',
  };

  async function loadAll(addr: string) {
    loading = true;
    error = null;
    try {
      const [score, sybil, badges] = await Promise.all([
        fetchScore(addr),
        fetchSybil(addr).catch(() => null),
        fetchBadges(addr).catch(() => null),
      ]);
      scoreData = score;
      sybilData = sybil;
      badgeData = badges;
    } catch (e) {
      scoreData = null;
      sybilData = null;
      badgeData = null;
      error = e instanceof Error ? e.message : 'Failed to load score';
    }
    loading = false;
  }

  $effect(() => {
    if (!address) return;
    loadAll(address);
  });

  function weightPct(key: ScoreCategory): string {
    return `${(CATEGORY_WEIGHTS[key] * 100).toFixed(0)}%`;
  }

  function maxWeighted(key: ScoreCategory): number {
    return MAX_CATEGORY_SCORE * CATEGORY_WEIGHTS[key];
  }

  function formatTimestamp(ts: number): string {
    return new Date(ts * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  let expandedCategories = $state<Record<string, boolean>>({});

  function toggleCategory(key: string) {
    expandedCategories = { ...expandedCategories, [key]: !expandedCategories[key] };
  }
</script>

<svelte:head>
  <title>Score Details — {address.slice(0, 6)}...{address.slice(-4)}</title>
</svelte:head>

<div class="space-y-8">
  <!-- Header -->
  <div>
    <a
      href="/score/{address}"
      class="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
    >
      <span>&larr;</span> Back to score
    </a>
    <div class="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
      <h1 class="text-2xl font-bold">Score Details</h1>
      <div class="flex flex-col gap-1">
        {#if scoreData?.ensName}
          <span class="text-lg font-semibold text-[var(--color-primary)]">{scoreData.ensName}</span>
        {/if}
        <code class="truncate rounded bg-[var(--color-surface)] px-3 py-1 text-sm text-[var(--color-text-muted)]">
          {address}
        </code>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="space-y-6">
      {#each [0, 1, 2, 3] as _}
        <div class="h-32 animate-pulse rounded-xl bg-[var(--color-surface)]"></div>
      {/each}
    </div>
  {:else if error}
    <div class="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-12 text-center">
      <p class="text-red-400">{error}</p>
      <button
        class="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90"
        onclick={() => loadAll(address)}
      >
        Retry
      </button>
    </div>
  {:else if scoreData}
    <!-- Section 1: Score Formula -->
    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 class="mb-4 text-lg font-semibold">Score Formula</h2>

      <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
        <div class="text-center">
          <p class="text-sm text-[var(--color-text-muted)]">Raw Score</p>
          <p class="text-3xl font-bold">{Math.round(scoreData.rawScore)}</p>
        </div>
        <span class="text-2xl text-[var(--color-text-muted)]">&times;</span>
        <div class="text-center">
          <p class="text-sm text-[var(--color-text-muted)]">Sybil Multiplier</p>
          <p class="text-3xl font-bold" class:text-red-400={scoreData.sybilMultiplier < 1}>
            {(scoreData.sybilMultiplier * 100).toFixed(0)}%
          </p>
        </div>
        <span class="text-2xl text-[var(--color-text-muted)]">=</span>
        <div class="text-center">
          <p class="text-sm text-[var(--color-text-muted)]">Total Score</p>
          <p class="text-3xl font-bold text-[var(--color-primary)]">{Math.round(scoreData.totalScore)}</p>
        </div>
      </div>

      <div class="relative mt-6 h-4 overflow-hidden rounded-full bg-[var(--color-bg)]">
        <div
          class="absolute inset-y-0 left-0 rounded-full bg-[var(--color-primary)] opacity-30"
          style="width: {(scoreData.rawScore / MAX_CATEGORY_SCORE) * 100}%"
        ></div>
        <div
          class="absolute inset-y-0 left-0 rounded-full bg-[var(--color-primary)]"
          style="width: {(scoreData.totalScore / MAX_CATEGORY_SCORE) * 100}%"
        ></div>
      </div>
      <div class="mt-1 flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>0</span>
        {#if scoreData.sybilMultiplier < 1}
          <span>Sybil penalty: &minus;{Math.round(scoreData.rawScore - scoreData.totalScore)} pts</span>
        {/if}
        <span>1000</span>
      </div>
    </div>

    <!-- Section 2: Category Breakdown with Signals -->
    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 class="mb-2 text-lg font-semibold">Category Breakdown</h2>
      <p class="mb-5 text-sm text-[var(--color-text-muted)]">
        Your raw score is the weighted sum of 5 category scores. Click a category to see its signals.
      </p>

      <div class="space-y-4">
        {#each categories as cat}
          {@const score = scoreData.breakdown[cat.key]}
          {@const max = maxWeighted(cat.key)}
          {@const signals = categorySignals[cat.key]}
          {@const expanded = expandedCategories[cat.key] ?? false}
          <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
            <button
              class="flex w-full cursor-pointer items-center justify-between text-left"
              onclick={() => toggleCategory(cat.key)}
            >
              <div class="flex items-center gap-2">
                <span class="inline-block h-3 w-3 rounded-full" style="background-color: {cat.color}"></span>
                <span class="font-medium">{cat.label}</span>
                <span class="text-xs text-[var(--color-text-muted)]">{weightPct(cat.key)}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-right text-sm">
                  <span class="font-medium">{Math.round(score.raw)}</span>
                  <span class="text-[var(--color-text-muted)]"> / {MAX_CATEGORY_SCORE}</span>
                </div>
                <span class="text-xs text-[var(--color-text-muted)]">{expanded ? '\u25B2' : '\u25BC'}</span>
              </div>
            </button>

            <div class="mt-2 h-2.5 overflow-hidden rounded-full" style="background-color: {cat.color}20">
              <div
                class="h-full rounded-full transition-all"
                style="width: {(score.raw / MAX_CATEGORY_SCORE) * 100}%; background-color: {cat.color}"
              ></div>
            </div>
            <div class="mt-1 flex justify-between text-xs text-[var(--color-text-muted)]">
              <span>{cat.desc}</span>
              <span>Weighted: {Math.round(score.weighted)} / {Math.round(max)}</span>
            </div>

            {#if expanded}
              <div class="mt-3 border-t border-[var(--color-border)] pt-3">
                <p class="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
                  {signals.length} signals contribute to this score:
                </p>
                <div class="space-y-1.5">
                  {#each signals as signal}
                    <div class="flex items-center justify-between text-xs">
                      <div>
                        <span class="text-[var(--color-text)]">{signal.name}</span>
                        <span class="ml-1 text-[var(--color-text-muted)]">&mdash; {signal.desc}</span>
                      </div>
                      <span class="ml-2 shrink-0 text-[var(--color-text-muted)]">cap {signal.cap}</span>
                    </div>
                  {/each}
                </div>
                <p class="mt-2 text-xs text-[var(--color-text-muted)]">
                  Signal scores are summed and capped at {MAX_CATEGORY_SCORE}.
                </p>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="mt-5 border-t border-[var(--color-border)] pt-4">
        <div class="flex items-center justify-between font-medium">
          <span>Raw Total (weighted sum)</span>
          <span>{Math.round(scoreData.rawScore)} / {MAX_CATEGORY_SCORE}</span>
        </div>
      </div>
    </div>

    <!-- Section 3: Sybil Analysis -->
    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 class="mb-2 text-lg font-semibold">Sybil Analysis</h2>
      <p class="mb-5 text-sm text-[var(--color-text-muted)]">
        10 behavioral heuristics determine the sybil confidence multiplier. Detected flags reduce
        the multiplier, lowering the final score.
      </p>

      <div class="mb-4 flex items-center gap-4">
        <div>
          <p class="text-sm text-[var(--color-text-muted)]">Confidence Multiplier</p>
          <p
            class="text-2xl font-bold"
            class:text-green-400={scoreData.sybilMultiplier >= 0.8}
            class:text-yellow-400={scoreData.sybilMultiplier >= 0.5 && scoreData.sybilMultiplier < 0.8}
            class:text-red-400={scoreData.sybilMultiplier < 0.5}
          >
            {(scoreData.sybilMultiplier * 100).toFixed(0)}%
          </p>
        </div>
        <div class="flex-1">
          <div class="h-3 overflow-hidden rounded-full bg-[var(--color-bg)]">
            <div
              class="h-full rounded-full transition-all"
              class:bg-green-500={scoreData.sybilMultiplier >= 0.8}
              class:bg-yellow-500={scoreData.sybilMultiplier >= 0.5 && scoreData.sybilMultiplier < 0.8}
              class:bg-red-500={scoreData.sybilMultiplier < 0.5}
              style="width: {scoreData.sybilMultiplier * 100}%"
            ></div>
          </div>
        </div>
      </div>

      {#if sybilData}
        <div class="space-y-2">
          {#each sybilData.flags as flag}
            <div
              class="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm {flag.detected ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--color-border)]'}"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs">{flag.detected ? '\u{1F6A9}' : '\u2705'}</span>
                  <span class="font-medium">{flag.label}</span>
                </div>
                {#if flag.details}
                  <p class="mt-0.5 pl-6 text-xs text-[var(--color-text-muted)]">{flag.details}</p>
                {/if}
              </div>
              <span
                class="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium {flag.detected ? 'bg-red-500/20 text-red-400' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'}"
              >
                {flag.detected ? `-${(flag.penalty * 100).toFixed(0)}%` : 'Clear'}
              </span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-[var(--color-text-muted)]">
          Sybil heuristic details unavailable.
        </p>
      {/if}
    </div>

    <!-- Section 4: Badges -->
    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 class="mb-2 text-lg font-semibold">Badges</h2>
      <p class="mb-5 text-sm text-[var(--color-text-muted)]">
        Achievement badges earned through onchain activity milestones.
      </p>

      {#if badgeData}
        <div class="grid gap-3 sm:grid-cols-2">
          {#each badgeData.badges as badge}
            <div
              class="flex items-start gap-3 rounded-lg border px-3 py-3 {badge.earned ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5' : 'border-[var(--color-border)] opacity-50'}"
            >
              <span class="text-xl">{badgeEmojis[badge.type] ?? ''}</span>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{badge.label}</span>
                  <span class="rounded px-1.5 py-0.5 text-xs {badge.earned ? 'bg-green-500/20 text-green-400' : 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'}">
                    {badge.earned ? 'Earned' : 'Locked'}
                  </span>
                </div>
                <p class="mt-0.5 text-xs text-[var(--color-text-muted)]">{badge.description}</p>
                {#if badge.earned && badge.earnedAt}
                  <p class="mt-1 text-xs text-[var(--color-text-muted)]">
                    Earned {formatDate(badge.earnedAt)}
                  </p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-[var(--color-text-muted)]">Badge details unavailable.</p>
      {/if}
    </div>

    <!-- Section 5: Verification -->
    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <h2 class="mb-4 text-lg font-semibold">Verification</h2>

      <div class="space-y-3 text-sm">
        <div class="flex items-center justify-between">
          <span class="text-[var(--color-text-muted)]">Computed at</span>
          <span>{formatTimestamp(scoreData.timestamp)}</span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-[var(--color-text-muted)]">Score address</span>
          <code class="text-xs">{scoreData.address}</code>
        </div>

        {#if scoreData.breakdownCID}
          <div class="flex items-center justify-between">
            <span class="text-[var(--color-text-muted)]">IPFS Breakdown</span>
            <a
              href="https://gateway.pinata.cloud/ipfs/{scoreData.breakdownCID}"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[var(--color-primary)] hover:underline"
            >
              View on IPFS &nearr;
            </a>
          </div>
        {/if}

        <div class="mt-3 rounded-lg bg-[var(--color-bg)] p-3 text-xs text-[var(--color-text-muted)]">
          <p class="mb-1 font-medium text-[var(--color-text)]">How scoring works</p>
          <p>
            ChainCred indexes wallet activity across 7 chains (Ethereum, Arbitrum, Optimism, Base,
            zkSync, Polygon, Starknet). 35+ signals across 5 categories produce a raw score (0–1000),
            which is then adjusted by a sybil confidence multiplier derived from 10 behavioral heuristics.
            Scores are published as EAS attestations with IPFS-backed breakdowns for trustless verification.
          </p>
        </div>
      </div>
    </div>
  {:else}
    <div class="py-20 text-center text-[var(--color-text-muted)]">
      No score data found for this wallet.
    </div>
  {/if}
</div>
