<script lang="ts">
  import { goto } from '$app/navigation';
  import { isValidAddress } from '@chaincred/common';

  let query = $state('');
  let error = $state('');

  function handleSearch() {
    error = '';
    const trimmed = query.trim();
    if (!trimmed) return;

    if (isValidAddress(trimmed)) {
      goto(`/score/${trimmed}`);
    } else {
      error = 'Please enter a valid Ethereum address';
    }
  }
</script>

<div class="w-full max-w-xl">
  <form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="flex gap-2">
    <input
      type="text"
      bind:value={query}
      placeholder="Enter wallet address (0x...)"
      class="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
    />
    <button
      type="submit"
      class="rounded-lg bg-[var(--color-primary)] px-6 py-3 font-medium text-white hover:opacity-90"
    >
      Search
    </button>
  </form>
  {#if error}
    <p class="mt-2 text-sm text-red-400">{error}</p>
  {/if}
</div>
