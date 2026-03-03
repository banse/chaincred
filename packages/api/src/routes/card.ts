import { Hono } from 'hono';
import { isValidAddress } from '@chaincred/common';
import { cache } from '../middleware/cache.js';
import { getScore } from '../services/score.js';

export const cardRoutes = new Hono();

function renderSvg(address: string, score: number): string {
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const scoreColor = score >= 700 ? '#22c55e' : score >= 400 ? '#eab308' : '#ef4444';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="418" viewBox="0 0 800 418">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="800" height="418" rx="16" fill="url(#bg)"/>
  <text x="40" y="50" font-family="system-ui,sans-serif" font-size="20" font-weight="700" fill="#94a3b8">ChainCred</text>
  <text x="400" y="200" font-family="system-ui,sans-serif" font-size="120" font-weight="800" fill="${scoreColor}" text-anchor="middle">${score}</text>
  <text x="400" y="240" font-family="system-ui,sans-serif" font-size="18" fill="#64748b" text-anchor="middle">Expertise Score</text>
  <text x="400" y="370" font-family="monospace" font-size="16" fill="#94a3b8" text-anchor="middle">${shortAddr}</text>
  <rect x="20" y="390" width="760" height="4" rx="2" fill="#1e293b"/>
  <rect x="20" y="390" width="${Math.round((score / 1000) * 760)}" height="4" rx="2" fill="${scoreColor}"/>
</svg>`;
}

cardRoutes.get('/:address', cache(300), async (c) => {
  const raw = c.req.param('address') ?? '';
  const address = raw.replace(/\.png$/, '');
  if (!isValidAddress(address)) {
    return c.json({ error: 'Invalid Ethereum address' }, 400);
  }
  const { totalScore } = await getScore(address);
  const svg = renderSvg(address, totalScore);
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
  });
});
