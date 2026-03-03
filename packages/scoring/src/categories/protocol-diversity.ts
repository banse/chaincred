import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

/** PRD 4.5 — Protocol diversity: unique protocols, chain breadth, domain coverage */
export function calculateProtocolDiversityScore(activity: WalletActivity): CategoryScore {
  // Protocol count: 35 pts each, capped at 350
  const protocolScore = Math.min(activity.uniqueProtocols.length * 35, 350);

  // Chain diversity: 50 pts per chain, capped at 250
  const chainScore = Math.min(activity.chainsActive.length * 50, 250);

  // Cross-domain coverage: 80 pts per distinct category, capped at 400
  // Categories: defi, social, governance, infrastructure, gaming, builder-tools
  const categoryScore = Math.min(activity.protocolCategories.length * 80, 400);

  // Early adoption: 60 pts per protocol used within 6 months of launch, capped at 300
  const earlyAdoptionScore = Math.min(activity.earlyAdoptions * 60, 300);

  const raw = Math.min(protocolScore + chainScore + categoryScore + earlyAdoptionScore, MAX_CATEGORY_SCORE);
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.protocolDiversity,
  };
}
