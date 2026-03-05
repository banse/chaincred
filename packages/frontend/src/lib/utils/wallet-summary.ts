import type { WalletScore, ScoreCategory } from '@chaincred/common';

export interface Finding {
  emoji: string;
  text: string;
}

const CATEGORY_LABELS: Record<ScoreCategory, string> = {
  builder: 'Builder',
  governance: 'Governance',
  temporal: 'Temporal',
  protocolDiversity: 'Protocol Diversity',
  complexity: 'Complexity',
};

/** Analyze a WalletScore and return 3–6 notable findings. */
export function generateWalletFindings(score: WalletScore): Finding[] {
  const findings: { priority: number; emoji: string; text: string }[] = [];
  const b = score.breakdown;

  // Helper to safely read a signal value
  const sig = (cat: ScoreCategory, key: string): number =>
    b[cat]?.signals?.[key] ?? 0;

  // --- Strongest category ---
  const catEntries = (Object.keys(b) as ScoreCategory[]).map((k) => ({
    key: k,
    raw: b[k].raw,
  }));
  catEntries.sort((a, z) => z.raw - a.raw);
  const strongest = catEntries[0];
  if (strongest.raw >= 200) {
    findings.push({
      priority: 1,
      emoji: '\u{1F3C6}',
      text: `Strongest in ${CATEGORY_LABELS[strongest.key]} (${Math.round(strongest.raw)}/1000)`,
    });
  }

  // --- Builder signals ---
  if (sig('builder', 'verifiedSource') >= 50) {
    findings.push({
      priority: 10,
      emoji: '\u{1F3D7}\u{FE0F}',
      text:
        sig('builder', 'externalUsers') >= 30
          ? 'Prolific builder with verified contracts and real users'
          : 'Deployed verified smart contracts onchain',
    });
  } else if (sig('builder', 'deployments') >= 80) {
    findings.push({
      priority: 11,
      emoji: '\u{1F3D7}\u{FE0F}',
      text: 'Active contract deployer across multiple chains',
    });
  }
  if (sig('builder', 'create2') >= 30) {
    findings.push({
      priority: 15,
      emoji: '\u{1F9EA}',
      text: 'Uses CREATE2 deterministic deployments',
    });
  }

  // --- Governance signals ---
  if (sig('governance', 'proposals') >= 100) {
    const chains = Math.round(sig('governance', 'crossChainGov') / 25);
    findings.push({
      priority: 20,
      emoji: '\u{1F5F3}\u{FE0F}',
      text:
        chains >= 2
          ? `Authored governance proposals across ${chains} chains`
          : 'Authored governance proposals',
    });
  } else if (sig('governance', 'votes') >= 100) {
    findings.push({
      priority: 21,
      emoji: '\u{1F5F3}\u{FE0F}',
      text: 'Active governance participant with significant voting history',
    });
  }
  if (sig('governance', 'safeExecutions') >= 25) {
    findings.push({
      priority: 25,
      emoji: '\u{1F510}',
      text: 'Safe multi-sig operator',
    });
  }

  // --- Temporal signals ---
  const ageYears = Math.round(sig('temporal', 'walletAge') / 50);
  if (ageYears >= 2) {
    const bearMarkets = Math.round(sig('temporal', 'crossCyclePersistence') / 75);
    findings.push({
      priority: 30,
      emoji: '\u{26F0}\u{FE0F}',
      text:
        bearMarkets >= 2
          ? `${ageYears}-year veteran, active through ${bearMarkets} bear markets`
          : `${ageYears}-year-old wallet with consistent activity`,
    });
  }

  // --- Protocol diversity signals ---
  const earlyAdoptions = Math.round(sig('protocolDiversity', 'earlyAdoption') / 30);
  if (earlyAdoptions >= 3) {
    findings.push({
      priority: 40,
      emoji: '\u{1F680}',
      text: `Early adopter of ${earlyAdoptions} protocols`,
    });
  }
  const domains = Math.round(sig('protocolDiversity', 'crossDomainCoverage') / 40);
  if (domains >= 3) {
    findings.push({
      priority: 41,
      emoji: '\u{1F310}',
      text: `Active across ${domains} protocol domains (DeFi, social, gaming, etc.)`,
    });
  }
  const chains = Math.round(sig('protocolDiversity', 'chainDiversity') / 40);
  if (chains >= 3) {
    findings.push({
      priority: 42,
      emoji: '\u{1F517}',
      text: `Multi-chain presence across ${chains} networks`,
    });
  }

  // --- Complexity signals ---
  if (sig('complexity', 'flashloan') >= 50) {
    findings.push({
      priority: 50,
      emoji: '\u{26A1}',
      text: 'Flashloan user — advanced DeFi operator',
    });
  }
  if (sig('complexity', 'permit') >= 30) {
    findings.push({
      priority: 51,
      emoji: '\u{1F511}',
      text: 'Uses EIP-712 permit signatures for gasless approvals',
    });
  }

  // --- Sybil ---
  if (score.sybilMultiplier >= 0.95) {
    findings.push({
      priority: 60,
      emoji: '\u{1F6E1}\u{FE0F}',
      text: `Clean sybil check (${(score.sybilMultiplier * 100).toFixed(0)}%)`,
    });
  } else if (score.sybilMultiplier < 0.8) {
    findings.push({
      priority: 5,
      emoji: '\u{1F6A9}',
      text: `Sybil flags detected — confidence reduced to ${(score.sybilMultiplier * 100).toFixed(0)}%`,
    });
  }

  // --- Weakest category (only if notably lower) ---
  const weakest = catEntries[catEntries.length - 1];
  if (strongest.raw - weakest.raw >= 400 && weakest.raw < 200) {
    findings.push({
      priority: 70,
      emoji: '\u{1F4CA}',
      text: `Weakest in ${CATEGORY_LABELS[weakest.key]} (${Math.round(weakest.raw)}/1000) — room to grow`,
    });
  }

  // Sort by priority, take 3–6
  findings.sort((a, z) => a.priority - z.priority);
  return findings.slice(0, 6).map(({ emoji, text }) => ({ emoji, text }));
}
