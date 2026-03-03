import type { BadgeType } from '../types/badge.js';

export interface BadgeDefinition {
  type: BadgeType;
  label: string;
  description: string;
  color: string;
  emoji: string;
}

/** PRD Section 6 — Badge definitions */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: 'builder',
    label: 'Builder',
    description: '3+ deployed contracts with external users',
    color: '#F97316',
    emoji: '🏗️',
  },
  {
    type: 'governor',
    label: 'Governor',
    description: 'Voted in 5+ DAOs, authored 1+ proposal',
    color: '#A855F7',
    emoji: '🗳️',
  },
  {
    type: 'explorer',
    label: 'Explorer',
    description: '20+ unique protocols across 3+ domains',
    color: '#14B8A6',
    emoji: '🧪',
  },
  {
    type: 'og',
    label: 'OG',
    description: 'Pre-2020 wallet, bear market activity',
    color: '#EAB308',
    emoji: '⛰️',
  },
  {
    type: 'multichain',
    label: 'Multichain',
    description: 'Active on 4+ L2s with governance/build activity',
    color: '#3B82F6',
    emoji: '🌐',
  },
  {
    type: 'trusted',
    label: 'Trusted',
    description: 'Governance in 3+ DAOs with delegation and proposals',
    color: '#94A3B8',
    emoji: '🔐',
  },
  {
    type: 'power-user',
    label: 'Power User',
    description: 'Protocol diversity 700+ and complexity 500+',
    color: '#EF4444',
    emoji: '⚡',
  },
];
