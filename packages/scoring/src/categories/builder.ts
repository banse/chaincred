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

  // Signal 6: ERC-4337 operations (handleOps/handleAggregatedOps) — 40 pts each, cap 200
  const erc4337Score = Math.min(activity.erc4337Operations * 40, 200);

  // Signal 7: Deployment longevity — 60 pts per 6-month period since first deployment, cap 180
  const now = Math.floor(Date.now() / 1000);
  const deploymentAgeMonths =
    activity.earliestDeploymentTimestamp > 0
      ? (now - activity.earliestDeploymentTimestamp) / 2592000
      : 0;
  const longevityScore =
    deploymentAgeMonths >= 6 ? Math.min(Math.floor(deploymentAgeMonths / 6) * 60, 180) : 0;

  // Signal 8: Verified source deployments — 80 pts each, cap 240
  const verifiedScore = Math.min(activity.verifiedDeployments * 80, 240);

  const raw = Math.min(
    deployScore + chainScore + constructorScore + focusScore + create2Score + erc4337Score + longevityScore + verifiedScore,
    MAX_CATEGORY_SCORE,
  );
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.builder,
  };
}
