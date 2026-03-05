import type { WalletActivity, CategoryScore } from '@chaincred/common';
import { CATEGORY_WEIGHTS, MAX_CATEGORY_SCORE, BUILDER_SIGNALS } from '@chaincred/common';

const S = BUILDER_SIGNALS;

/** PRD 4.2 — Multi-signal builder scoring with 10 signals */
export function calculateBuilderScore(activity: WalletActivity): CategoryScore {
  // Signal 1: Contract deployments
  const deployScore = Math.min(activity.contractsDeployed * S.deployments.perUnit, S.deployments.cap);

  // Signal 2: Multi-chain deployments
  const chainScore = Math.min(activity.deploymentChains.length * S.multiChainDeploys.perUnit, S.multiChainDeploys.cap);

  // Signal 3: Constructor complexity — sqrt(avg bytes) x multiplier
  let constructorScore = 0;
  if (activity.contractsDeployed > 0) {
    const avgBytes = activity.deploymentCalldataBytes / activity.contractsDeployed;
    constructorScore = Math.min(Math.round(Math.sqrt(avgBytes) * S.constructorComplexity.multiplier), S.constructorComplexity.cap);
  }

  // Signal 4: Deployment focus ratio — (deploys / total txs) x multiplier
  let focusScore = 0;
  if (activity.totalTransactions > 0) {
    const ratio = activity.contractsDeployed / activity.totalTransactions;
    focusScore = Math.min(Math.round(ratio * S.deploymentFocus.multiplier), S.deploymentFocus.cap);
  }

  // Signal 5: CREATE2 deployments
  const create2Score = Math.min(activity.create2Deployments * S.create2.perUnit, S.create2.cap);

  // Signal 6: ERC-4337 operations (handleOps/handleAggregatedOps)
  const erc4337Score = Math.min(activity.erc4337Operations * S.erc4337.perUnit, S.erc4337.cap);

  // Signal 7: Deployment longevity — perUnit pts per 6-month period since first deployment
  const now = Math.floor(Date.now() / 1000);
  const deploymentAgeMonths =
    activity.earliestDeploymentTimestamp > 0
      ? (now - activity.earliestDeploymentTimestamp) / 2592000
      : 0;
  const longevityScore =
    deploymentAgeMonths >= 6 ? Math.min(Math.floor(deploymentAgeMonths / 6) * S.longevity.perUnit, S.longevity.cap) : 0;

  // Signal 8: Verified source deployments
  const verifiedScore = Math.min(activity.verifiedDeployments * S.verifiedSource.perUnit, S.verifiedSource.cap);

  // Signal 9: Contract external users
  const externalUsersScore = Math.min(activity.contractExternalUsers * S.externalUsers.perUnit, S.externalUsers.cap);

  // Signal 10: Active contracts (>6mo)
  const activeContractsScore = Math.min(activity.activeContracts * S.activeContracts.perUnit, S.activeContracts.cap);

  const raw = Math.min(
    deployScore + chainScore + constructorScore + focusScore + create2Score + erc4337Score + longevityScore + verifiedScore + externalUsersScore + activeContractsScore,
    MAX_CATEGORY_SCORE,
  );
  return {
    raw,
    weighted: raw * CATEGORY_WEIGHTS.builder,
    signals: {
      deployments: deployScore,
      multiChainDeploys: chainScore,
      constructorComplexity: constructorScore,
      deploymentFocus: focusScore,
      create2: create2Score,
      erc4337: erc4337Score,
      longevity: longevityScore,
      verifiedSource: verifiedScore,
      externalUsers: externalUsersScore,
      activeContracts: activeContractsScore,
    },
  };
}
