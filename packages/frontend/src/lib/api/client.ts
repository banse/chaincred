import type { WalletScore, WalletBadges, SybilResult, Attestation } from '@chaincred/common';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/v1';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function fetchScore(address: string) {
  return apiFetch<WalletScore>(`/score/${address}`);
}

export function fetchBadges(address: string) {
  return apiFetch<WalletBadges>(`/badges/${address}`);
}

export function fetchSybil(address: string) {
  return apiFetch<SybilResult>(`/sybil/${address}`);
}

export function fetchAttestation(address: string) {
  return apiFetch<Attestation | null>(`/attestation/${address}`);
}

export interface LeaderboardResponse {
  category: string;
  entries: { address: string; score: number; breakdown: any; sybilMultiplier: number }[];
  total: number;
  limit: number;
  offset: number;
}

export function fetchLeaderboard(category = 'overall', limit = 50, offset = 0) {
  return apiFetch<LeaderboardResponse>(`/leaderboard?category=${category}&limit=${limit}&offset=${offset}`);
}

export interface TimelineEvent {
  type: 'first_tx' | 'first_deployment' | 'first_governance' | 'chain_added' | 'badge_earned';
  timestamp: number;
  chain?: string;
  detail?: string;
}

export interface TimelineResponse {
  address: string;
  events: TimelineEvent[];
}

export function fetchTimeline(address: string) {
  return apiFetch<TimelineResponse>(`/timeline/${address}`);
}

export interface StatsResponse {
  walletsScored: number;
  chainsIndexed: number;
}

export function fetchStats() {
  return apiFetch<StatsResponse>('/stats');
}

/** Subscribe to real-time score updates via WebSocket. Returns cleanup function. */
export function subscribeToScore(
  address: string,
  onMessage: (data: any) => void,
  onError?: (error: Event) => void,
): () => void {
  const wsUrl = API_BASE.replace(/^http/, 'ws');
  const ws = new WebSocket(`${wsUrl}/stream/${address}`);

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch {
      onMessage(event.data);
    }
  };

  ws.onerror = (event) => {
    onError?.(event);
  };

  return () => {
    ws.close();
  };
}
