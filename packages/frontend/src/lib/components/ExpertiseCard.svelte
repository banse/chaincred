<script lang="ts">
  import type { WalletScore } from '@chaincred/common';

  let { score, address }: { score: WalletScore; address?: string } = $props();

  let copied = $state(false);

  function shareUrl(): string {
    if (!address) return '';
    return `${window.location.origin}/score/${address}`;
  }

  function shareText(): string {
    return `My ChainCred expertise score is ${Math.round(score.totalScore)}/1000! Check yours:`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // Fallback: noop
    }
  }

  function shareOnX() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${encodeURIComponent(shareUrl())}`;
    window.open(url, '_blank', 'noopener');
  }

  function shareOnWarpcast() {
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText())}&embeds[]=${encodeURIComponent(shareUrl())}`;
    window.open(url, '_blank', 'noopener');
  }
</script>

<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
  <h2 class="text-lg font-semibold text-[var(--color-text-muted)]">Expertise Score</h2>
  <p class="mt-2 text-6xl font-bold text-[var(--color-primary)]">{Math.round(score.totalScore)}</p>
  <p class="mt-1 text-sm text-[var(--color-text-muted)]">out of 1000</p>
  <div class="mt-4 h-2 rounded-full bg-[var(--color-bg)]">
    <div
      class="progress-fill h-full rounded-full bg-[var(--color-primary)]"
      style="width: {(score.totalScore / 1000) * 100}%"
    ></div>
  </div>

  <div class="mt-4 flex gap-4 text-xs text-[var(--color-text-muted)]">
    <span>Sybil: <span class="font-medium text-[var(--color-text)]">{(score.sybilMultiplier * 100).toFixed(0)}%</span></span>
    <span>Raw: <span class="font-medium text-[var(--color-text)]">{Math.round(score.rawScore)}</span></span>
  </div>

  {#if address}
    <div class="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4">
      <button
        class="rounded-lg bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        onclick={copyLink}
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <button
        class="rounded-lg bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        onclick={shareOnX}
      >
        Share on X
      </button>
      <button
        class="rounded-lg bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        onclick={shareOnWarpcast}
      >
        Cast
      </button>
    </div>
  {/if}
</div>
