<script lang="ts">
  import '../../lib/widget/chaincred-verify.js';

  let wallet = $state('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  let minScore = $state('500');
  let requiredBadges = $state('builder,governor');
</script>

<svelte:head>
  <title>Verification Widget — ChainCred</title>
</svelte:head>

<div class="max-w-3xl mx-auto p-6">
  <h1 class="text-2xl font-bold mb-2">Verification Widget</h1>
  <p class="text-gray-500 mb-6">
    Embeddable Web Component for third-party score verification. Drop it into any page with a single script tag.
  </p>

  <div class="grid gap-6 md:grid-cols-2">
    <div>
      <h2 class="font-semibold mb-3">Configuration</h2>
      <label class="block mb-2 text-sm">
        Wallet address
        <input type="text" class="w-full border rounded px-3 py-2 mt-1 text-sm font-mono" bind:value={wallet} />
      </label>
      <label class="block mb-2 text-sm">
        Minimum score
        <input type="number" class="w-full border rounded px-3 py-2 mt-1 text-sm" bind:value={minScore} />
      </label>
      <label class="block mb-4 text-sm">
        Required badges (comma-separated)
        <input type="text" class="w-full border rounded px-3 py-2 mt-1 text-sm" bind:value={requiredBadges} />
      </label>

      <h2 class="font-semibold mb-2">Usage</h2>
      <pre class="bg-gray-100 rounded p-3 text-xs overflow-x-auto">{`<script src="/widget/chaincred-verify.js"><\/script>
<chaincred-verify
  wallet="${wallet}"
  min-score="${minScore}"
  required-badges="${requiredBadges}"
/>`}</pre>
    </div>

    <div>
      <h2 class="font-semibold mb-3">Live Preview</h2>
      <chaincred-verify
        wallet={wallet}
        min-score={minScore}
        required-badges={requiredBadges}
      ></chaincred-verify>
    </div>
  </div>
</div>
