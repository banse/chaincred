import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE } from '@chaincred/common';

/** PRD 4.2 — Multi-signal builder scoring with 4 signals */
export function calculateBuilderScore(activity: WalletActivity): CategoryScore {
  // Signal 1: Contract deployments — 40 pts each, cap 280
  const deployScore = Math.min(activity.contractsDeployed * 40, 280);

  // Signal 2: Multi-chain deployments — 50 pts per chain, cap 200
  const chainScore = Math.min(activity.deploymentChains.length * 50, 200);

  // Signal 3: Constructor complexity — sqrt(avg bytes) x 10, cap 100
  let constructorScore = 0;
  if (activity.contractsDeployed > 0) {
    const avgBytes = activity.deploymentCalldataBytes / activity.contractsDeployed;
    constructorScore = Math.min(Math.round(Math.sqrt(avgBytes) * 10), 100);
  }

  // Signal 4: Deployment focus ratio — (deploys / total txs) x 400, cap 80
  let focusScore = 0;
  if (activity.totalTransactions > 0) {
    const ratio = activity.contractsDeployed / activity.totalTransactions;
    focusScore = Math.min(Math.round(ratio * 400), 80);
  }

  // Signal 5: CREATE2 deployments — 30 pts each, cap 120
  const create2Score = Math.min(activity.create2Deployments * 30, 120);

  // Signal 6: ERC-4337 operations (handleOps/handleAggregatedOps) — 25 pts each, cap 100
  const erc4337Score = Math.min(activity.erc4337Operations * 25, 100);

  // Signal 7: Deployment longevity — 30 pts per 6-month period since first deployment, cap 90
  const now = Math.floor(Date.now() / 1000);
  const deploymentAgeMonths =
    activity.earliestDeploymentTimestamp > 0
      ? (now - activity.earliestDeploymentTimestamp) / 2592000
      : 0;
  const longevityScore =
    deploymentAgeMonths >= 6 ? Math.min(Math.floor(deploymentAgeMonths / 6) * 30, 90) : 0;

  // Signal 8: Verified source deployments — 50 pts each, cap 200
  const verifiedScore = Math.min(activity.verifiedDeployments * 50, 200);

  // Signal 9: Contract external users — 15 pts per unique caller, cap 150
  const externalUsersScore = Math.min(activity.contractExternalUsers * 15, 150);

  // Signal 10: Active contracts (>6mo) — 40 pts each, cap 200
  const activeContractsScore = Math.min(activity.activeContracts * 40, 200);

  const raw = Math.min(
    deployScore + chainScore + constructorScore + focusScore + create2Score + erc4337Score + longevityScore + verifiedScore + externalUsersScore + activeContractsScore,
    MAX_CATEGORY_SCORE,
  );
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.builder,
  };
}
