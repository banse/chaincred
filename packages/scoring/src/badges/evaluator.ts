import type { WalletActivity, Badge, BadgeType, WalletBadges, ScoreBreakdown } from '@chaincred/common';
import { BADGE_DEFINITIONS, BADGE_THRESHOLDS } from '@chaincred/common';

const B = BADGE_THRESHOLDS;

export function evaluateBadges(activity: WalletActivity, score: ScoreBreakdown): WalletBadges {
  const now = Math.floor(Date.now() / 1000);

  const criteriaChecks: Record<BadgeType, boolean> = {
    builder: activity.contractsDeployed >= B.builder.minDeployments,
    governor: activity.daosParticipated.length >= B.governor.minDaos && activity.proposalsCreated >= B.governor.minProposals,
    explorer: activity.uniqueProtocols.length >= B.explorer.minProtocols,
    og: activity.firstTxTimestamp < B.og.beforeTimestamp,
    multichain: activity.chainsActive.length >= B.multichain.minChains,
    trusted:
      activity.safeExecutions >= B.trusted.minSafeExecutions &&
      activity.daosParticipated.length >= B.trusted.minDaos &&
      activity.delegationEvents >= B.trusted.minDelegations,
    'power-user': score.protocolDiversity.raw >= B.powerUser.minProtocolDiversityRaw && score.complexity.raw >= B.powerUser.minComplexityRaw,
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
