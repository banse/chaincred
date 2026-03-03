const API_BASE = 'http://localhost:3001/v1';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function fetchScore(address: string) {
  return apiFetch(`/score/${address}`);
}

export function fetchBadges(address: string) {
  return apiFetch(`/badges/${address}`);
}

export function fetchSybil(address: string) {
  return apiFetch(`/sybil/${address}`);
}

export function fetchLeaderboard(category = 'overall', limit = 50) {
  return apiFetch(`/leaderboard?category=${category}&limit=${limit}`);
}
