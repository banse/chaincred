<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="min-h-screen bg-[var(--color-bg)]">
  <nav class="border-b border-[var(--color-border)] px-6 py-4">
    <div class="mx-auto flex max-w-6xl items-center justify-between">
      <a href="/" class="text-xl font-bold text-[var(--color-primary)]">ChainCred</a>
      <div class="flex items-center gap-4">
        <a href="/leaderboard" class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          Leaderboard
        </a>
        <button class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Connect Wallet
        </button>
      </div>
    </div>
  </nav>
  <main class="mx-auto max-w-6xl px-6 py-8">
    {@render children()}
  </main>
</div>
