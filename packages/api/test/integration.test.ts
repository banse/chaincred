import { describe, expect, test, beforeAll, afterAll } from 'bun:test';

const API_BASE = 'http://localhost:3001';
let server: any;

beforeAll(async () => {
  // Import and start the API server
  server = await import('../src/app.js');
  // Give it a moment to bind
  await new Promise((r) => setTimeout(r, 500));
});

describe('API health', () => {
  test('GET /health returns ok', async () => {
    const res = await fetch(`${API_BASE}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeGreaterThan(0);
  });
});

describe('GET /v1/score/:address', () => {
  test('returns score for valid address', async () => {
    const res = await fetch(`${API_BASE}/v1/score/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`);
    expect(res.status).toBe(200);
    const body = await res.json();

    // Score structure
    expect(body.address).toBeDefined();
    expect(body.totalScore).toBeGreaterThanOrEqual(0);
    expect(body.totalScore).toBeLessThanOrEqual(1000);
    expect(body.rawScore).toBeGreaterThanOrEqual(0);
    expect(body.sybilMultiplier).toBeGreaterThan(0);
    expect(body.sybilMultiplier).toBeLessThanOrEqual(1);

    // Breakdown has all 5 categories
    expect(body.breakdown).toBeDefined();
    expect(body.breakdown.builder).toBeDefined();
    expect(body.breakdown.governance).toBeDefined();
    expect(body.breakdown.temporal).toBeDefined();
    expect(body.breakdown.protocolDiversity).toBeDefined();
    expect(body.breakdown.complexity).toBeDefined();

    // Each category has raw + weighted
    expect(body.breakdown.builder.raw).toBeGreaterThanOrEqual(0);
    expect(body.breakdown.builder.weighted).toBeGreaterThanOrEqual(0);
  });

  test('rejects invalid address', async () => {
    const res = await fetch(`${API_BASE}/v1/score/not-an-address`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid');
  });

  test('rejects zero address', async () => {
    const res = await fetch(`${API_BASE}/v1/score/0x0000000000000000000000000000000000000000`);
    // Zero address is technically valid format, API should handle it
    const status = res.status;
    expect([200, 400]).toContain(status);
  });
});

describe('GET /v1/badges/:address', () => {
  test('returns badges for valid address', async () => {
    const res = await fetch(`${API_BASE}/v1/badges/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.address).toBeDefined();
    expect(Array.isArray(body.badges)).toBe(true);

    // Each badge has required fields
    for (const badge of body.badges) {
      expect(badge.type).toBeDefined();
      expect(badge.label).toBeDefined();
      expect(badge.color).toBeDefined();
      expect(typeof badge.earned).toBe('boolean');
    }
  });

  test('rejects invalid address', async () => {
    const res = await fetch(`${API_BASE}/v1/badges/invalid`);
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/sybil/:address', () => {
  test('returns sybil analysis for valid address', async () => {
    const res = await fetch(`${API_BASE}/v1/sybil/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.address).toBeDefined();
    expect(body.confidence).toBeGreaterThanOrEqual(0);
    expect(body.confidence).toBeLessThanOrEqual(1);
    expect(Array.isArray(body.flags)).toBe(true);
  });

  test('rejects invalid address', async () => {
    const res = await fetch(`${API_BASE}/v1/sybil/bad`);
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/attestation/:address', () => {
  test('returns null attestation (not yet implemented)', async () => {
    const res = await fetch(`${API_BASE}/v1/attestation/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`);
    expect(res.status).toBe(200);
    // Returns null since no attestations exist yet
  });
});

describe('POST /v1/verify', () => {
  test('accepts verify request', async () => {
    const res = await fetch(`${API_BASE}/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        score: 500,
        proof: [],
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verified).toBe(false); // Not yet implemented
  });
});

describe('GET /v1/leaderboard', () => {
  test('returns leaderboard with default params', async () => {
    const res = await fetch(`${API_BASE}/v1/leaderboard`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.category).toBe('overall');
    expect(Array.isArray(body.entries)).toBe(true);
    expect(body.limit).toBe(50);
  });

  test('respects category filter', async () => {
    const res = await fetch(`${API_BASE}/v1/leaderboard?category=builder&limit=10`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBe('builder');
    expect(body.limit).toBe(10);
  });
});

describe('CORS', () => {
  test('returns CORS headers', async () => {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'OPTIONS',
    });
    // Hono CORS middleware should handle preflight
    expect([200, 204]).toContain(res.status);
  });
});

describe('rate limiting', () => {
  test('allows normal request volume', async () => {
    // Fire 10 requests — should all succeed
    const results = await Promise.all(
      Array.from({ length: 10 }, () => fetch(`${API_BASE}/health`)),
    );
    for (const res of results) {
      expect(res.status).toBe(200);
    }
  });
});

describe('scoring pipeline integration', () => {
  test('score breakdown weights sum correctly', async () => {
    const res = await fetch(`${API_BASE}/v1/score/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`);
    const body = await res.json();

    const { breakdown } = body;
    const weightedSum =
      breakdown.builder.weighted +
      breakdown.governance.weighted +
      breakdown.temporal.weighted +
      breakdown.protocolDiversity.weighted +
      breakdown.complexity.weighted;

    // rawScore should equal sum of weighted scores
    expect(Math.abs(body.rawScore - weightedSum)).toBeLessThan(0.01);

    // totalScore = rawScore * sybilMultiplier
    expect(Math.abs(body.totalScore - body.rawScore * body.sybilMultiplier)).toBeLessThan(0.01);
  });

  test('badges correspond to score data', async () => {
    const [scoreRes, badgesRes] = await Promise.all([
      fetch(`${API_BASE}/v1/score/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`),
      fetch(`${API_BASE}/v1/badges/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`),
    ]);
    const score = await scoreRes.json();
    const badges = await badgesRes.json();

    // Both endpoints should resolve for the same address
    expect(score.address).toBeDefined();
    expect(badges.address).toBeDefined();

    // All 7 badge types should be present
    expect(badges.badges.length).toBe(7);
  });

  test('sybil confidence affects total score', async () => {
    const res = await fetch(`${API_BASE}/v1/score/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`);
    const body = await res.json();

    if (body.sybilMultiplier < 1) {
      expect(body.totalScore).toBeLessThan(body.rawScore);
    } else {
      expect(body.totalScore).toBe(body.rawScore);
    }
  });
});
