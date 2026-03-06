<script lang="ts">
  import type { ScoreBreakdown } from '@chaincred/common';

  let { breakdown, address }: { breakdown: ScoreBreakdown; address?: string } = $props();

  const categories = [
    { key: 'builder', label: 'Builder', color: '#F97316' },
    { key: 'governance', label: 'Governance', color: '#A855F7' },
    { key: 'temporal', label: 'Temporal', color: '#22D3EE' },
    { key: 'protocolDiversity', label: 'Diversity', color: '#10B981' },
    { key: 'complexity', label: 'Complexity', color: '#EF4444' },
  ] as const;

  const cx = 130;
  const cy = 105;
  const radius = 65;
  const rings = [0.33, 0.66, 1.0];

  function angle(i: number): number {
    return (i * 2 * Math.PI) / 5 - Math.PI / 2;
  }

  function point(i: number, r: number): { x: number; y: number } {
    return {
      x: cx + r * Math.cos(angle(i)),
      y: cy + r * Math.sin(angle(i)),
    };
  }

  function ringPath(scale: number): string {
    const r = radius * scale;
    return categories
      .map((_, i) => {
        const p = point(i, r);
        return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
      })
      .join(' ') + ' Z';
  }

  function axisLine(i: number): { x1: number; y1: number; x2: number; y2: number } {
    const p = point(i, radius);
    return { x1: cx, y1: cy, x2: p.x, y2: p.y };
  }

  function labelPos(i: number): { x: number; y: number; anchor: string } {
    const p = point(i, radius + 14);
    let anchor = 'middle';
    if (p.x < cx - 10) anchor = 'end';
    else if (p.x > cx + 10) anchor = 'start';
    return { x: p.x, y: p.y + 4, anchor };
  }

  const scorePath = $derived(() => {
    return categories
      .map((cat, i) => {
        const raw = breakdown[cat.key].raw;
        const r = radius * Math.min(raw / 1000, 1);
        const p = point(i, r);
        return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
      })
      .join(' ') + ' Z';
  });
</script>

<div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
  <h2 class="text-lg font-semibold text-[var(--color-text-muted)]">Score Breakdown</h2>

  <div class="mt-4 flex justify-center">
    <svg viewBox="0 0 260 210" class="h-52 w-52">
      <!-- Grid rings -->
      {#each rings as scale}
        <path d={ringPath(scale)} fill="none" stroke="var(--color-border)" stroke-width="0.5" />
      {/each}

      <!-- Axis lines -->
      {#each categories as _, i}
        {@const axis = axisLine(i)}
        <line
          x1={axis.x1} y1={axis.y1} x2={axis.x2} y2={axis.y2}
          stroke="var(--color-border)" stroke-width="0.5"
        />
      {/each}

      <!-- Score polygon -->
      <path
        d={scorePath()}
        fill="var(--color-primary)"
        fill-opacity="0.2"
        stroke="var(--color-primary)"
        stroke-width="1.5"
      />

      <!-- Score dots -->
      {#each categories as cat, i}
        {@const raw = breakdown[cat.key].raw}
        {@const r = radius * Math.min(raw / 1000, 1)}
        {@const p = point(i, r)}
        <circle cx={p.x} cy={p.y} r="3" fill={cat.color} />
      {/each}

      <!-- Labels -->
      {#each categories as cat, i}
        {@const lbl = labelPos(i)}
        <text
          x={lbl.x} y={lbl.y}
          text-anchor={lbl.anchor}
          fill={cat.color}
          font-size="9"
          font-weight="600"
        >
          {cat.label}
        </text>
      {/each}
    </svg>
  </div>

  <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
    {#each categories as cat}
      {@const score = breakdown[cat.key]}
      <div class="flex items-center gap-1.5">
        <span class="inline-block h-2 w-2 rounded-full" style="background-color: {cat.color}"></span>
        <span class="text-[var(--color-text-muted)]">{cat.label}</span>
        <span class="ml-auto font-medium">{Math.round(score.raw)}</span>
      </div>
    {/each}
  </div>

</div>
