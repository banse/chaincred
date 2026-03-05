import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE, PROTOCOL_DIVERSITY_SIGNALS } from '@chaincred/common';

const S = PROTOCOL_DIVERSITY_SIGNALS;

/** PRD 4.5 — Protocol diversity: unique protocols, chain breadth, domain coverage */
export function calculateProtocolDiversityScore(activity: WalletActivity): CategoryScore {
  // Protocol count
  const protocolScore = Math.min(activity.uniqueProtocols.length * S.protocolCount.perUnit, S.protocolCount.cap);

  // Chain diversity
  const chainScore = Math.min(activity.chainsActive.length * S.chainDiversity.perUnit, S.chainDiversity.cap);

  // Cross-domain coverage
  const categoryScore = Math.min(activity.protocolCategories.length * S.crossDomainCoverage.perUnit, S.crossDomainCoverage.cap);

  // Early adoption
  const earlyAdoptionScore = Math.min(activity.earlyAdoptions * S.earlyAdoption.perUnit, S.earlyAdoption.cap);

  const raw = Math.min(protocolScore + chainScore + categoryScore + earlyAdoptionScore, MAX_CATEGORY_SCORE);
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.protocolDiversity,
    signals: {
      protocolCount: protocolScore,
      chainDiversity: chainScore,
      crossDomainCoverage: categoryScore,
      earlyAdoption: earlyAdoptionScore,
    },
  };
}
