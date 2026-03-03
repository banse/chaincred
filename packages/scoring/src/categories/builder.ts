import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

/** PRD 4.2 — Multi-signal builder scoring with 4 signals */
export function calculateBuilderScore(activity: WalletActivity): CategoryScore {
  // Signal 1: Contract deployments — 60 pts each, cap 420
  const deployScore = Math.min(activity.contractsDeployed * 60, 420);

  // Signal 2: Multi-chain deployments — 80 pts per chain, cap 320
  const chainScore = Math.min(activity.deploymentChains.length * 80, 320);

  // Signal 3: Constructor complexity — sqrt(avg bytes) x 15, cap 200
  let constructorScore = 0;
  if (activity.contractsDeployed > 0) {
    const avgBytes = activity.deploymentCalldataBytes / activity.contractsDeployed;
    constructorScore = Math.min(Math.round(Math.sqrt(avgBytes) * 15), 200);
  }

  // Signal 4: Deployment focus ratio — (deploys / total txs) x 800, cap 160
  let focusScore = 0;
  if (activity.totalTransactions > 0) {
    const ratio = activity.contractsDeployed / activity.totalTransactions;
    focusScore = Math.min(Math.round(ratio * 800), 160);
  }

  // Signal 5: CREATE2 deployments — 50 pts each, cap 150
  const create2Score = Math.min(activity.create2Deployments * 50, 150);

  const raw = Math.min(deployScore + chainScore + constructorScore + focusScore + create2Score, MAX_CATEGORY_SCORE);
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.builder,
  };
}
