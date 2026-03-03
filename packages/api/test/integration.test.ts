import { describe, expect, test } from 'bun:test';

// Import the app module to get the fetch handler
const mod = await import('../src/app.js');
const appFetch = mod.default.fetch as (req: Request) => Promise<Response>;

function req(path: string, init?: RequestInit) {
  return appFetch(new Request(`http://localhost${path}`, init));
}

// --- Tests that don't require external services ---

describe('API health', () => {
  test('GET /health returns ok', async () => {
    const res = await req('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeGreaterThan(0);
  });
});

describe('address validation', () => {
  test('rejects invalid address on /v1/score', async () => {
    const res = await req('/v1/score/not-an-address');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid');
  });

  test('rejects invalid address on /v1/badges', async () => {
    const res = await req('/v1/badges/invalid');
    expect(res.status).toBe(400);
  });

  test('rejects invalid address on /v1/sybil', async () => {
    const res = await req('/v1/sybil/bad');
    expect(res.status).toBe(400);
  });

  test('rejects invalid address on /v1/proof', async () => {
    const res = await req('/v1/proof/invalid');
    expect(res.status).toBe(400);
  });
});

describe('POST /v1/verify', () => {
  test('returns 503 when contract not configured', async () => {
    const res = await req('/v1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        score: 500,
        proof: [],
      }),
    });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.verified).toBe(false);
    expect(body.message).toContain('not configured');
  });
});

describe('CORS', () => {
  test('returns CORS headers', async () => {
    const res = await req('/health', { method: 'OPTIONS' });
    expect([200, 204]).toContain(res.status);
  });
});

describe('rate limiting', () => {
  test('allows normal request volume', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => req('/health')),
    );
    for (const res of results) {
      expect(res.status).toBe(200);
    }
  });
});

// --- Tests that need PostgreSQL (return 500 without DB, which is acceptable) ---

describe('DB-dependent routes (require PostgreSQL)', () => {
  test('GET /v1/score/:address returns 200 or 500', async () => {
    const res = await req('/v1/score/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    // 200 with DB, 500 without
    if (res.status === 200) {
      const body = await res.json();
      expect(body.totalScore).toBeGreaterThanOrEqual(0);
      expect(body.totalScore).toBeLessThanOrEqual(1000);
      expect(body.breakdown).toBeDefined();
      expect(body.sybilMultiplier).toBeGreaterThan(0);
    } else {
      expect(res.status).toBe(500);
    }
  });

  test('GET /v1/badges/:address returns 200 or 500', async () => {
    const res = await req('/v1/badges/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    if (res.status === 200) {
      const body = await res.json();
      expect(Array.isArray(body.badges)).toBe(true);
      expect(body.badges.length).toBe(7);
    } else {
      expect(res.status).toBe(500);
    }
  });

  test('GET /v1/sybil/:address returns 200 or 500', async () => {
    const res = await req('/v1/sybil/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    if (res.status === 200) {
      const body = await res.json();
      expect(body.confidence).toBeGreaterThanOrEqual(0);
      expect(body.confidence).toBeLessThanOrEqual(1);
    } else {
      expect(res.status).toBe(500);
    }
  });

  test('GET /v1/attestation/:address returns 200', async () => {
    // Attestation returns null without schema UID — no DB needed for that path
    const res = await req('/v1/attestation/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    expect(res.status).toBe(200);
  });

  test('GET /v1/leaderboard returns 200 or 500', async () => {
    const res = await req('/v1/leaderboard');
    if (res.status === 200) {
      const body = await res.json();
      expect(body.category).toBe('overall');
      expect(Array.isArray(body.entries)).toBe(true);
    } else {
      expect(res.status).toBe(500);
    }
  });

  test('GET /v1/leaderboard respects params', async () => {
    const res = await req('/v1/leaderboard?category=builder&limit=10');
    if (res.status === 200) {
      const body = await res.json();
      expect(body.category).toBe('builder');
      expect(body.limit).toBe(10);
    } else {
      expect(res.status).toBe(500);
    }
  });

  test('GET /v1/stats returns 200 or 500', async () => {
    const res = await req('/v1/stats');
    if (res.status === 200) {
      const body = await res.json();
      expect(body.walletsScored).toBeGreaterThanOrEqual(0);
      expect(body.chainsIndexed).toBe(6);
    } else {
      expect(res.status).toBe(500);
    }
  });

  test('GET /v1/proof/:address returns 404 or 500', async () => {
    const res = await req('/v1/proof/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    // 404 when no proof exists, 500 when no DB
    expect([404, 500]).toContain(res.status);
  });

  test('GET /v1/timeline/:address returns 200 or 500', async () => {
    const res = await req('/v1/timeline/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    if (res.status === 200) {
      const body = await res.json();
      expect(body.address).toBeDefined();
      expect(Array.isArray(body.events)).toBe(true);
    } else {
      expect(res.status).toBe(500);
    }
  });

  test('GET /v1/timeline/:address has expected event fields', async () => {
    const res = await req('/v1/timeline/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    if (res.status === 200) {
      const body = await res.json();
      for (const event of body.events) {
        expect(['first_tx', 'first_deployment', 'first_governance', 'chain_added', 'badge_earned']).toContain(
          event.type,
        );
        expect(event.timestamp).toBeGreaterThan(0);
      }
    } else {
      expect(res.status).toBe(500);
    }
  });

  test('GET /v1/card/:address.png returns SVG or 500', async () => {
    const res = await req('/v1/card/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045.png');
    if (res.status === 200) {
      const contentType = res.headers.get('content-type');
      expect(contentType).toContain('image/svg+xml');
      const body = await res.text();
      expect(body).toContain('<svg');
      expect(body).toContain('ChainCred');
    } else {
      expect(res.status).toBe(500);
    }
  });
});

describe('Farcaster Frame', () => {
  test('POST /v1/frame returns HTML with valid address', async () => {
    const res = await req('/v1/frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        untrustedData: { inputText: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
      }),
    });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('fc:frame');
    expect(html).toContain('View Details');
  });

  test('POST /v1/frame returns error frame with invalid address', async () => {
    const res = await req('/v1/frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ untrustedData: { inputText: 'not-an-address' } }),
    });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Try Again');
  });
});

describe('admin endpoints', () => {
  test('GET /v1/admin/bear-periods lists periods', async () => {
    const res = await req('/v1/admin/bear-periods');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.periods)).toBe(true);
    expect(body.periods.length).toBeGreaterThanOrEqual(3);
    expect(body.periods[0].source).toBe('hardcoded');
  });

  test('POST /v1/admin/bear-periods requires auth', async () => {
    const res = await req('/v1/admin/bear-periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'test', startTimestamp: 1, endTimestamp: 2 }),
    });
    expect(res.status).toBe(401);
  });
});

describe('webhook endpoints (DB-dependent)', () => {
  test('POST /v1/webhooks registers a webhook or 500', async () => {
    const res = await req('/v1/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        url: 'https://example.com/hook',
      }),
    });
    if (res.status === 201) {
      const body = await res.json();
      expect(body.id).toBeDefined();
      expect(body.url).toBe('https://example.com/hook');
    } else {
      expect(res.status).toBe(500);
    }
  });

  test('GET /v1/webhooks lists registered webhooks or 500', async () => {
    const res = await req('/v1/webhooks');
    if (res.status === 200) {
      const body = await res.json();
      expect(Array.isArray(body.webhooks)).toBe(true);
    } else {
      expect(res.status).toBe(500);
    }
  });
});

describe('timeline validation', () => {
  test('rejects invalid address on /v1/timeline', async () => {
    const res = await req('/v1/timeline/not-an-address');
    expect(res.status).toBe(400);
  });

  test('rejects invalid address on /v1/card', async () => {
    const res = await req('/v1/card/not-an-address.png');
    expect(res.status).toBe(400);
  });
});

describe('appeal validation', () => {
  test('POST /v1/appeals rejects invalid address', async () => {
    const res = await req('/v1/appeals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: 'bad', reason: 'test' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /v1/appeals rejects missing fields', async () => {
    const res = await req('/v1/appeals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }),
    });
    expect(res.status).toBe(400);
  });

  test('GET /v1/appeals rejects invalid address', async () => {
    const res = await req('/v1/appeals/not-an-address');
    expect(res.status).toBe(400);
  });
});


describe('webhook validation', () => {
  test('POST /v1/webhooks rejects invalid address', async () => {
    const res = await req('/v1/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: 'bad', url: 'https://example.com' }),
    });
    expect(res.status).toBe(400);
  });

  test('POST /v1/webhooks rejects missing fields', async () => {
    const res = await req('/v1/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' }),
    });
    expect(res.status).toBe(400);
  });
});
