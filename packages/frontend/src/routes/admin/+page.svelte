<script lang="ts">
  import {
    adminIndexWallet,
    adminGetQueue,
    adminGetWallets,
    type IndexJob,
    type AdminWallet,
  } from '$lib/api/client.js';

  let adminKey = $state('');
  let addressInput = $state('');
  let jobs = $state<IndexJob[]>([]);
  let wallets = $state<AdminWallet[]>([]);
  let walletsLoading = $state(false);
  let error = $state<string | null>(null);
  let pollInterval = $state<ReturnType<typeof setInterval> | null>(null);

  function shortAddr(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  function timeAgo(ms: number): string {
    const s = Math.floor((Date.now() - ms) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  function statusColor(status: string): string {
    switch (status) {
      case 'queued': return 'bg-yellow-500/20 text-yellow-400';
      case 'indexing': return 'bg-blue-500/20 text-blue-400';
      case 'done': return 'bg-green-500/20 text-green-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }

  async function loadQueue() {
    if (!adminKey) return;
    try {
      const res = await adminGetQueue(adminKey);
      jobs = res.jobs;
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load queue';
    }
  }

  async function loadWallets() {
    if (!adminKey) return;
    walletsLoading = true;
    try {
      const res = await adminGetWallets(adminKey);
      wallets = res.wallets;
    } catch {
      wallets = [];
    }
    walletsLoading = false;
  }

  async function handleIndex() {
    if (!adminKey || !addressInput.trim()) return;
    error = null;
    try {
      await adminIndexWallet(addressInput.trim(), adminKey);
      addressInput = '';
      await loadQueue();
      startPolling();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to submit';
    }
  }

  async function reindex(address: string) {
    if (!adminKey) return;
    try {
      await adminIndexWallet(address, adminKey);
      await loadQueue();
      startPolling();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to reindex';
    }
  }

  let reindexingAll = $state(false);

  async function reindexAll() {
    if (!adminKey || wallets.length === 0) return;
    reindexingAll = true;
    error = null;
    try {
      for (const w of wallets) {
        await adminIndexWallet(w.address, adminKey);
      }
      await loadQueue();
      startPolling();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to reindex all';
    }
    reindexingAll = false;
  }

  function startPolling() {
    if (pollInterval) return;
    pollInterval = setInterval(async () => {
      await loadQueue();
      const hasActive = jobs.some((j) => j.status === 'queued' || j.status === 'indexing');
      if (!hasActive && pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
        loadWallets();
      }
    }, 2000);
  }

  function handleConnect() {
    loadQueue();
    loadWallets();
    // Start polling if there are active jobs
    const hasActive = jobs.some((j) => j.status === 'queued' || j.status === 'indexing');
    if (hasActive) startPolling();
  }
</script>

<div class="space-y-8">
  <h1 class="text-2xl font-bold">Admin</h1>

  <!-- Admin Key -->
  <div class="flex gap-3">
    <input
      type="password"
      bind:value={adminKey}
      placeholder="Admin API key"
      class="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
    />
    <button
      onclick={handleConnect}
      disabled={!adminKey}
      class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
    >
      Connect
    </button>
  </div>

  {#if error}
    <div class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      {error}
    </div>
  {/if}

  <!-- Index Wallet Form -->
  <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
    <h2 class="mb-3 text-lg font-semibold">Index Wallet</h2>
    <form
      onsubmit={(e) => { e.preventDefault(); handleIndex(); }}
      class="flex gap-3"
    >
      <input
        type="text"
        bind:value={addressInput}
        placeholder="0x address"
        class="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 font-mono text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={!adminKey || !addressInput.trim()}
        class="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        Index
      </button>
    </form>
  </div>

  <!-- Queue -->
  {#if jobs.length > 0}
    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 class="mb-3 text-lg font-semibold">Indexing Queue</h2>
      <div class="space-y-2">
        {#each jobs as job}
          <div class="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
            <span class="rounded-md px-2 py-0.5 text-xs font-medium {statusColor(job.status)}">
              {job.status}
            </span>
            <span class="font-mono text-sm">{shortAddr(job.address)}</span>
            <span class="flex-1 truncate text-sm text-[var(--color-text-muted)]">{job.progress}</span>
            {#if job.txCount > 0}
              <span class="text-sm text-[var(--color-accent)]">{job.txCount.toLocaleString()} txs</span>
            {/if}
            <span class="text-xs text-[var(--color-text-muted)]">{timeAgo(job.startedAt)}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Existing Wallets -->
  <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
    <div class="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
      <h2 class="text-lg font-semibold">Indexed Wallets</h2>
      {#if wallets.length > 0}
        <button
          onclick={reindexAll}
          disabled={!adminKey || reindexingAll}
          class="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {reindexingAll ? 'Queuing...' : `Re-index All (${wallets.length})`}
        </button>
      {/if}
    </div>

    {#if walletsLoading}
      <div class="px-4 py-8 text-center text-[var(--color-text-muted)]">Loading...</div>
    {:else if wallets.length === 0}
      <div class="px-4 py-8 text-center text-[var(--color-text-muted)]">
        {adminKey ? 'No wallets indexed yet.' : 'Enter admin key and connect.'}
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full min-w-[540px]">
          <thead>
            <tr class="border-b border-[var(--color-border)] text-left text-sm text-[var(--color-text-muted)]">
              <th class="px-4 py-3">Address</th>
              <th class="px-4 py-3">Transactions</th>
              <th class="px-4 py-3">Updated</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {#each wallets as w}
              <tr class="border-t border-[var(--color-border)] hover:bg-[var(--color-bg)]">
                <td class="px-4 py-3">
                  <a
                    href="/score/{w.address}"
                    class="text-sm text-[var(--color-primary)] hover:underline"
                    class:font-mono={!w.ensName}
                  >
                    {w.ensName || shortAddr(w.address)}
                  </a>
                </td>
                <td class="px-4 py-3 text-sm">{w.txCount.toLocaleString()}</td>
                <td class="px-4 py-3 text-sm text-[var(--color-text-muted)]">{timeAgo(w.updatedAt)}</td>
                <td class="px-4 py-3">
                  <button
                    onclick={() => reindex(w.address)}
                    disabled={!adminKey}
                    class="rounded-md bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-primary)] disabled:opacity-50"
                  >
                    Re-index
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
