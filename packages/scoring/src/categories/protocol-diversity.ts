import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

export function calculateProtocolDiversityScore(activity: WalletActivity): CategoryScore {
  const raw = Math.min(
    activity.uniqueProtocols.length * 40 + activity.chainsActive.length * 80,
    MAX_CATEGORY_SCORE,
  );
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.protocolDiversity,
  };
}
