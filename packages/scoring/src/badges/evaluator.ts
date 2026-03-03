import type { WalletActivity, Badge, BadgeType, WalletBadges, ScoreBreakdown } from '@chaincred/common';
import { BADGE_DEFINITIONS } from '@chaincred/common';

/** Unix timestamp for 2020-01-01T00:00:00Z */
const TIMESTAMP_2020 = 1577836800;

export function evaluateBadges(activity: WalletActivity, score: ScoreBreakdown): WalletBadges {
  const now = Math.floor(Date.now() / 1000);

  const criteriaChecks: Record<BadgeType, boolean> = {
    builder: activity.contractsDeployed >= 3,
    governor: activity.daosParticipated.length >= 5,
    explorer: activity.uniqueProtocols.length >= 20,
    og: activity.firstTxTimestamp < TIMESTAMP_2020,
    multichain: activity.chainsActive.length >= 4,
    trusted: false, // Placeholder
    'power-user': false, // Placeholder
  };

  const badges: Badge[] = BADGE_DEFINITIONS.map((def) => {
    const earned = criteriaChecks[def.type];
    return {
      type: def.type,
      label: def.label,
      description: def.description,
      color: def.color,
      earned,
      ...(earned ? { earnedAt: now } : {}),
    };
  });

  return {
    address: activity.address,
    badges,
  };
}
