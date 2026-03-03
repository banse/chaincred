<script lang="ts">
  import SearchBar from '$lib/components/SearchBar.svelte';

  let stats = {
    walletsScored: 10_432,
    attestationsIssued: 3_291,
    chainsIndexed: 6,
  };
</script>

<div class="flex flex-col items-center gap-12 py-16">
  <div class="text-center">
    <h1 class="text-5xl font-bold tracking-tight">
      Your wallet's expertise,
      <span class="text-[var(--color-primary)]">provable</span>.
    </h1>
    <p class="mt-4 text-lg text-[var(--color-text-muted)]">
      Onchain reputation scores based on what you do — not what you hold.
    </p>
  </div>

  <SearchBar />

  <div class="grid grid-cols-3 gap-8 text-center">
    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <p class="text-3xl font-bold text-[var(--color-accent)]">{stats.walletsScored.toLocaleString()}</p>
      <p class="mt-1 text-sm text-[var(--color-text-muted)]">Wallets Scored</p>
    </div>
    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <p class="text-3xl font-bold text-[var(--color-accent)]">{stats.attestationsIssued.toLocaleString()}</p>
      <p class="mt-1 text-sm text-[var(--color-text-muted)]">Attestations Issued</p>
    </div>
    <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <p class="text-3xl font-bold text-[var(--color-accent)]">{stats.chainsIndexed}</p>
      <p class="mt-1 text-sm text-[var(--color-text-muted)]">Chains Indexed</p>
    </div>
  </div>
</div>
