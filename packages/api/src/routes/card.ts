import { Hono } from 'hono';
import { isValidAddress, BADGE_DEFINITIONS } from '@chaincred/common';
import type { ScoreBreakdown, Badge } from '@chaincred/common';
import { getScore } from '../services/score.js';
import { getWalletActivity } from '../services/activity.js';
import { evaluateBadges } from '@chaincred/scoring';

export const cardRoutes = new Hono();

interface CardData {
  address: string;
  score: number;
  breakdown: ScoreBreakdown;
  badges: Badge[];
  ensName?: string;
}

function renderSvg(data: CardData): string {
  const { address, score, breakdown, badges, ensName } = data;
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const scoreColor = score >= 700 ? '#22c55e' : score >= 400 ? '#eab308' : '#ef4444';

  const categories = [
    { key: 'builder', label: 'Builder', color: '#F97316', raw: breakdown.builder.raw },
    { key: 'governance', label: 'Governance', color: '#A855F7', raw: breakdown.governance.raw },
    { key: 'temporal', label: 'Temporal', color: '#EAB308', raw: breakdown.temporal.raw },
    { key: 'diversity', label: 'Diversity', color: '#14B8A6', raw: breakdown.protocolDiversity.raw },
    { key: 'complexity', label: 'Complexity', color: '#3B82F6', raw: breakdown.complexity.raw },
  ];

  // Category breakdown bars
  const barY = 195;
  const barHeight = 14;
  const barGap = 22;
  const labelX = 40;
  const barX = 160;
  const barMaxW = 560;
  const bars = categories
    .map((cat, i) => {
      const y = barY + i * barGap;
      const w = Math.round((cat.raw / 1000) * barMaxW);
      return `<text x="${labelX}" y="${y + 11}" font-family="system-ui,sans-serif" font-size="12" fill="#94a3b8">${cat.label}</text>
    <rect x="${barX}" y="${y}" width="${barMaxW}" height="${barHeight}" rx="3" fill="#1e293b"/>
    <rect x="${barX}" y="${y}" width="${w}" height="${barHeight}" rx="3" fill="${cat.color}"/>
    <text x="${barX + barMaxW + 10}" y="${y + 11}" font-family="system-ui,sans-serif" font-size="11" fill="#64748b">${cat.raw}</text>`;
    })
    .join('\n  ');

  // Badge row
  const badgeY = barY + categories.length * barGap + 20;
  const badgeStartX = 160;
  const badgeGap = 36;
  const badgeCircles = BADGE_DEFINITIONS.map((def, i) => {
    const earned = badges.find((b) => b.type === def.type)?.earned ?? false;
    const cx = badgeStartX + i * badgeGap;
    const fill = earned ? def.color : '#334155';
    const opacity = earned ? '1' : '0.4';
    return `<circle cx="${cx}" cy="${badgeY}" r="12" fill="${fill}" opacity="${opacity}"/>
    <text x="${cx}" y="${badgeY + 4}" font-size="10" text-anchor="middle" fill="white">${def.emoji}</text>`;
  }).join('\n  ');

  // Identity above score
  const ensLine = ensName
    ? `<text x="400" y="44" font-family="system-ui,sans-serif" font-size="18" font-weight="600" fill="#e2e8f0" text-anchor="middle">${ensName}</text>`
    : '';
  const addrY = ensName ? 64 : 50;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="418" viewBox="0 0 800 418">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="800" height="418" rx="16" fill="url(#bg)"/>
  <text x="40" y="50" font-family="system-ui,sans-serif" font-size="20" font-weight="700" fill="#94a3b8">ChainCred</text>
  ${ensLine}
  <text x="400" y="${addrY}" font-family="monospace" font-size="13" fill="#94a3b8" text-anchor="middle">${shortAddr}</text>
  <text x="400" y="140" font-family="system-ui,sans-serif" font-size="64" font-weight="800" fill="${scoreColor}" text-anchor="middle">${score}</text>
  <text x="400" y="165" font-family="system-ui,sans-serif" font-size="15" fill="#64748b" text-anchor="middle">Expertise Score</text>
  ${bars}
  <text x="${labelX}" y="${badgeY + 4}" font-family="system-ui,sans-serif" font-size="12" fill="#94a3b8">Badges</text>
  ${badgeCircles}
</svg>`;
}

cardRoutes.get('/:address', async (c) => {
  const raw = c.req.param('address') ?? '';
  const address = raw.replace(/\.png$/, '');
  if (!isValidAddress(address)) {
    return c.json({ error: 'Invalid Ethereum address' }, 400);
  }

  try {
    const scoreData = await getScore(address);
    const activity = await getWalletActivity(address);
    const badgeResult = activity ? evaluateBadges(activity, scoreData.breakdown) : { badges: [] as Badge[] };

    const svg = renderSvg({
      address,
      score: scoreData.totalScore,
      breakdown: scoreData.breakdown,
      badges: badgeResult.badges,
      ensName: scoreData.ensName,
    });
    return new Response(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (err) {
    console.error('[Card Error]', err);
    return c.json({ error: 'Failed to generate card' }, 500);
  }
});
