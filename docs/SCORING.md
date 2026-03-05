# ChainCred Scoring Documentation

ChainCred computes an onchain expertise score (0–1000) for any Ethereum/EVM or Starknet wallet. This document explains every layer of the scoring system — from the final number down to individual protocol-level signals.

---

## Table of Contents

1. [Score Overview](#score-overview)
2. [Score Formula](#score-formula)
3. [Level Tiers](#level-tiers)
4. [Category Breakdown](#category-breakdown)
   - [Builder (30%)](#builder-30)
   - [Governance (25%)](#governance-25)
   - [Temporal (20%)](#temporal-20)
   - [Protocol Diversity (15%)](#protocol-diversity-15)
   - [Complexity (10%)](#complexity-10)
5. [Sybil Detection](#sybil-detection)
6. [Badges](#badges)
7. [Supported Chains](#supported-chains)
8. [Protocol Registry](#protocol-registry)

---

## Score Overview

Every wallet gets a single **Total Score** between 0 and 1000. This number reflects the wallet's depth and breadth of onchain activity — not just how many transactions it has, but *what kind* of activity, across how many chains, protocols, and time periods.

The score is designed so that:
- **1000 is nearly impossible** — even vitalik.eth scores 967 with real indexed data
- **Most active users land between 400–800** — this is the meaningful differentiation range
- **Casual users score 50–200** — having a wallet and a few swaps gets you started
- **Sybil farms get penalized** — 10 behavioral heuristics detect and reduce bot/farm scores

---

## Score Formula

```
Total Score = round(Raw Score × Sybil Multiplier)
```

Where:

```
Raw Score = Builder Raw × 0.30
          + Governance Raw × 0.25
          + Temporal Raw × 0.20
          + Protocol Diversity Raw × 0.15
          + Complexity Raw × 0.10
```

Each category produces a **raw score** (0–1000) from the sum of its individual signals, capped at 1000. The category raw scores are then weighted and summed. Since the weights add up to 1.0, the raw score naturally ranges 0–1000.

The **sybil multiplier** (0.0–1.0) is applied last. A clean wallet gets 1.0 (no penalty). A suspicious wallet can be reduced to near-zero.

---

## Level Tiers

The total score maps to a human-readable level:

| Level | Score Range | Description |
|-------|-------------|-------------|
| **Maxi** | 801–1000 | Deep multi-category expertise across chains and time |
| **Native** | 601–800 | Strong onchain citizen with real DeFi/governance activity |
| **Degen** | 401–600 | Active user exploring multiple protocols and chains |
| **Tourist** | 201–400 | Moderate activity, often concentrated on 1–2 chains |
| **Normie** | 0–200 | Minimal onchain footprint — a few transactions at most |

---

## Category Breakdown

### Builder (30%)

**Weight: 0.30** — the highest-weighted category. Builder activity is the strongest signal of genuine expertise because deploying contracts requires significant technical skill.

**Why 30%:** Contract deployment is the hardest activity to fake or automate without real knowledge. A sybil farm doesn't deploy contracts; a developer does. Rewarding builders most heavily biases the score toward genuine technical contribution.

#### Signals

| Signal | Formula | Cap | Why |
|--------|---------|-----|-----|
| **Deployments** | `contracts_deployed × 40` | 280 | Core builder signal — each deployed contract shows technical capability |
| **Multi-chain Deploys** | `deployment_chains × 50` | 200 | Deploying across chains shows deeper DevOps skill and broader ecosystem commitment |
| **Constructor Complexity** | `sqrt(avg_calldata_bytes) × 10` | 100 | Large constructor calldata = complex initialization logic, not simple token clones |
| **Deployment Focus** | `(contracts_deployed / total_txs) × 400` | 80 | High deploy-to-tx ratio distinguishes dedicated builders from people who deployed once |
| **CREATE2** | `create2_deployments × 30` | 120 | CREATE2 deterministic addresses show advanced deployment patterns (upgradeable, counterfactual) |
| **ERC-4337** | `erc4337_operations × 25` | 100 | Account abstraction usage signals cutting-edge builder activity |
| **Longevity** | `floor(deployment_age_months / 6) × 30` | 90 | Points per 6-month period since first deploy. Long-term builders > one-time deployers |
| **Verified Source** | `verified_deployments × 50` | 200 | Publishing source on Etherscan shows commitment to transparency and auditability |
| **External Users** | `contract_external_users × 15` | 150 | Contracts with real users prove utility beyond self-interaction |
| **Active Contracts** | `active_contracts × 40` | 200 | Contracts that are still being used, not abandoned |

**Cap sum: 1,520** — 52% headroom above the 1000 max means builders don't need to max every signal.

---

### Governance (25%)

**Weight: 0.25** — governance participation is the second most important signal because it requires ongoing, intentional engagement with the ecosystem's decision-making.

**Why 25%:** Voting, proposing, and delegating require understanding protocol mechanics and caring about outcomes. It's a strong signal of genuine ecosystem participation, not just transactional usage.

#### Signals

| Signal | Formula | Cap | Why |
|--------|---------|-----|-----|
| **Votes** | `governance_votes × 20` | 400 | Core governance signal — actually showing up to vote |
| **DAO Breadth** | `daos_participated × 60` | 360 | Voting in many DAOs shows broad governance interest, not single-protocol loyalty |
| **Proposals** | `proposals_created × 100` | 150 | Creating proposals is far harder than voting — each one counts heavily |
| **Delegation** | `delegation_events × 15` | 90 | Delegating tokens shows governance awareness even when not actively voting |
| **Treasury Execution** | `execution_events × 30` | 120 | Executing treasury/timelock operations shows trusted governance roles |
| **Cross-chain Governance** | `governance_chains × 25` | 150 | Governing across multiple chains shows ecosystem-wide commitment |
| **Independent Votes** | `independent_votes × 20` | 120 | Votes against the majority — signals genuine opinion vs. bandwagon voting |
| **Safe Executions** | `safe_executions × 25` | 200 | Multi-sig signer executing transactions — high-trust governance role |
| **Reasoned Votes** | `reasoned_votes × 25` | 150 | Votes with onchain reasoning attached — deeper governance engagement |

**Cap sum: 1,740** — 74% headroom.

---

### Temporal (20%)

**Weight: 0.20** — time-based signals distinguish genuine long-term participants from short-term farmers.

**Why 20%:** An old wallet that survived bear markets is qualitatively different from a new wallet with the same transaction count. Time cannot be faked (you can't backdate transactions), making it a reliable credibility signal.

#### Signals

| Signal | Formula | Cap | Why |
|--------|---------|-----|-----|
| **Wallet Age** | `wallet_age_years × 50` | 400 | Each year of age shows the wallet survived through market cycles |
| **Bear Market Txs** | `bear_market_txs × 5` | 300 | Transacting during bear markets (defined periods of 70%+ drawdown) shows conviction |
| **Consistency** | `(active_months / wallet_age_months) × 300` | 300 | Ratio of months with activity vs. total age. Consistent usage beats sporadic bursts |
| **Activity Entropy** | `(distinct_tx_hours / 24) × 200` | 200 | Number of distinct hours-of-day the wallet transacts. Humans use 8–15+ hours; bots use 2–3 |
| **Cross-cycle Persistence** | `bear_market_periods_active × 75` | 300 | Number of distinct bear market periods with activity. Surviving multiple cycles is exceptional |

**Cap sum: 1,500** — 50% headroom.

**Note on consistency:** The ratio-based formula means a 1-year wallet active every month scores the same as a 5-year wallet active every month. This is intentional — consistency measures *behavior pattern*, not duration (wallet age already rewards duration).

**Note on activity entropy:** This is an anti-bot signal. A human transacts at different times of day (morning, evening, weekends). An automated script runs at fixed intervals. 24 distinct hours = max score.

---

### Protocol Diversity (15%)

**Weight: 0.15** — breadth of protocol usage shows genuine exploration rather than single-protocol farming.

**Why 15%:** Using many protocols across different domains (DeFi, governance, gaming, social) demonstrates real ecosystem fluency. A wallet that only uses Uniswap is a trader; a wallet that uses Uniswap + Aave + ENS + Safe + Chainlink is a power user.

#### Signals

| Signal | Formula | Cap | Why |
|--------|---------|-----|-----|
| **Protocol Count** | `unique_protocols × 18` | 350 | Raw count of distinct protocols interacted with (from the 26 in the registry) |
| **Chain Diversity** | `chains_active × 40` | 250 | Number of chains with activity. Max 7 chains indexed → effective max 280 (capped at 250) |
| **Cross-domain Coverage** | `protocol_categories × 40` | 400 | Number of distinct protocol categories touched (6 domains: defi, governance, infrastructure, social, gaming, builder-tools) → effective max 240 |
| **Early Adoption** | `early_adoptions × 30` | 300 | Number of protocols used within 6 months of their launch. Early adopters take risk on new protocols |

**Cap sum: 1,300** — only 30% headroom, making this the hardest category to max. This is intentional — true protocol diversity requires genuine breadth.

**Natural scarcity:** Chain diversity is bounded by 7 indexed chains (effective max 280, capped at 250). Cross-domain coverage is bounded by 6 categories (effective max 240). Even perfect coverage can't reach 1000 from these two signals alone, forcing users to also have high protocol count and early adoption.

---

### Complexity (10%)

**Weight: 0.10** — transaction sophistication separates power users from basic token transfers.

**Why 10%:** This is weighted lowest because volume and complexity can be gamed more easily than the other categories. However, it still provides meaningful signal about whether a wallet executes simple transfers or complex multi-step DeFi operations.

#### Signals

| Signal | Formula | Cap | Why |
|--------|---------|-----|-----|
| **Transaction Volume** | `total_transactions × 1.5` | 300 | Base activity count — 200 txs to reach cap |
| **Fail Ratio** | `(failed_txs / total_txs) × 1000` | 300 | Higher failure rate = pushing limits. Experienced users hit edge cases; bots don't fail |
| **Avg Calldata** | `sqrt(total_calldata_bytes / total_txs) × 10` | 400 | Large calldata means complex function calls, not just ETH transfers |
| **Permit** | `permit_interactions × 10` | 200 | ERC-2612 permit usage shows DeFi sophistication (gasless approvals) |
| **Flashloan** | `flashloan_txs × 50` | 300 | Flashloan execution is one of the most complex DeFi operations |
| **Smart Wallet** | `smart_wallet_interactions × 15` | 150 | Using smart contract wallets (Safe, ERC-4337) shows advanced wallet management |
| **Internal Tx** | `sqrt(internal_transactions) × 8` | 200 | Internal transactions indicate contract-to-contract calls — multi-step operations |

**Cap sum: 1,850** — 85% headroom, the most generous category. This compensates for the low 10% weight.

**Note on fail ratio:** This is counterintuitive — failures score *higher*. The reasoning is that experienced users interacting with complex protocols hit reverts (slippage, frontrunning, gas estimation). A wallet with 10,000 txs and zero failures is likely a bot with perfect simulation.

---

## Sybil Detection

Sybil detection runs 10 behavioral heuristics against the wallet. Each detected flag applies a penalty that multiplicatively reduces a confidence multiplier starting at 1.0.

```
sybil_multiplier = 1.0
for each triggered heuristic:
    sybil_multiplier *= (1 - penalty)
```

Multiple detections compound. For example, if both Temporal Clustering (0.40 penalty) and Action Repetition (0.30 penalty) fire: `1.0 × 0.60 × 0.70 = 0.42` — the wallet keeps only 42% of its raw score.

### Heuristics

| # | Heuristic | Penalty | Trigger | Rationale |
|---|-----------|---------|---------|-----------|
| 1 | **Temporal Clustering** | 0.40 | `avg_txs_per_day > 20` AND `wallet_age < 90 days` | New wallets with extreme activity are likely farming. Real users don't sustain 20+ txs/day from day one. |
| 2 | **Action Repetition** | 0.30 | `total_txs > 100` AND `unique_protocols < 1` AND `chains_active < 2` | Repetitive zero-protocol, single-chain activity suggests scripted farming. Wallets interacting with at least one recognized protocol are exempt — single-protocol gaming users (e.g. FrenPet) are legitimate. |
| 3 | **Funding Graph Clustering** | 0.50 | `unique_recipients > 50` AND `unique_protocols < 2` AND `chains_active > 1` | Distributing to 50+ addresses through 1 protocol across chains = token/ETH distribution bot. Requires multi-chain to avoid flagging gaming users who interact with many addresses on one chain. |
| 4 | **Cross-chain Mirroring** | 0.60 | 3+ chains with identical sorted protocol sets (requires `chains_active >= 3`) | Using the exact same protocols in the exact same order across 3+ chains is a hallmark of scripted sybil farming that replays the same sequence everywhere. |
| 5 | **CEX Withdrawal Freshness** | 0.00–0.30 | `wallet_age < 30 days`: penalty = `0.30 × (1 - age/30)` | Brand new wallets funded directly from CEX withdrawal are often sybil accounts. Graduated: full penalty at day 0, decays to 0 by day 30. |
| 6 | **Zero Failure Rate** | 0.20 | `total_txs > 200` AND `failed_txs = 0` | 200+ transactions with zero failures suggests perfect simulation/pre-checking — characteristic of bots. Real users occasionally hit reverts. |
| 7 | **Perfect Gas Patterns** | 0.15 | `total_txs > 50` AND `distinct_gas_prices / total_txs < 0.5%` AND `distinct_gas_prices < 10` AND has mainnet activity | Extremely low gas price diversity on mainnet suggests hardcoded gas strategy. L2-only wallets are **exempt** (L2 gas prices are structurally stable by design). |
| 8 | **MEV Bot Activity** | 0.15 | `mev_interactions > 20` AND `mev_ratio > 30%` | Wallets where >30% of activity is MEV-related (sandwich attacks, arbitrage) are bots, not humans. |
| 9 | **Funding Source Cluster** | 0.50 | `funding_source_outbound_count > 10` AND `<= 500` (requires Etherscan enrichment) | The wallet's funding source also funded 10–500 other wallets — classic sybil coordinator pattern. Below 10 = normal. Above 500 = CEX/bridge/router (exempt). |
| 10 | **CEX Fresh Wallet** | 0.00–0.30 | `funded_by_cex = true` AND `wallet_age < 90 days`: penalty = `0.30 × (1 - age/90)` | CEX-funded wallets under 90 days old get graduated penalty. Decays to 0 by day 90. Older CEX-funded wallets are fine. |

### Design Principles

- **Compound conditions beat single thresholds** — each heuristic requires 2–3 conditions to fire simultaneously, reducing false positives on legitimate power users
- **L2 exemptions** — L2 chains have structurally different gas economics; gas entropy is not a meaningful bot signal on L2s
- **Range-based thresholds** — funding source uses a range (10–500) because sybil coordinators fund a moderate number of wallets, while CEXes and bridges fund thousands
- **Graduated penalties** — CEX freshness penalties decay over time rather than being binary, acknowledging that new wallets become less suspicious as they age

---

## Badges

Badges are binary achievements (earned/not earned) evaluated from wallet activity and category scores. They appear on the score card and profile.

| Badge | Criteria | Why |
|-------|----------|-----|
| **Builder** | 3+ deployed contracts | Proves contract deployment capability |
| **Governor** | 5+ DAOs participated AND 1+ proposals created | Active governance participant, not just a voter |
| **Explorer** | 20+ unique protocols | Genuine ecosystem exploration across the protocol registry |
| **OG** | First transaction before Jan 1, 2020 | Pre-DeFi-summer wallet age — can't be faked retroactively |
| **Multichain** | Active on 4+ chains | Cross-chain fluency across the supported chain set |
| **Trusted** | 2+ Safe executions, 3+ DAOs, 3+ delegations | High-trust governance role — multi-sig signer with broad delegation |
| **Power User** | Protocol Diversity raw >= 400 AND Complexity raw >= 300 | Cross-category achievement combining breadth and depth |

---

## Supported Chains

ChainCred indexes 7 chains. 6 EVM chains are indexed via [HyperSync](https://docs.envio.dev/docs/HyperSync/overview) (free, no API key). Starknet is indexed via JSON-RPC.

| Chain | ID | Type | Indexing Method |
|-------|----|------|-----------------|
| **Ethereum** | 1 | L1 | HyperSync |
| **Arbitrum One** | 42161 | L2 (Optimistic) | HyperSync |
| **Optimism** | 10 | L2 (Optimistic) | HyperSync |
| **Base** | 8453 | L2 (Optimistic) | HyperSync |
| **zkSync Era** | 324 | L2 (ZK) | HyperSync |
| **Polygon** | 137 | L2 (Sidechain) | HyperSync |
| **Starknet** | 0x534e5f4d41494e | L2 (ZK) | JSON-RPC |

---

## Protocol Registry

ChainCred tracks 26 protocols across 6 domains. A wallet's interaction with a protocol is detected by matching transaction `to` addresses against the registry's contract addresses per chain.

### Why These Protocols?

The registry is curated to cover the most important protocols in each domain, with preference for:
1. **Market dominance** — the most-used protocol in its category (Uniswap for DEX, Aave for lending)
2. **Historical significance** — protocols that defined their category (MakerDAO for stablecoins, ENS for identity)
3. **Chain representation** — at least one protocol per supported chain where possible
4. **Domain coverage** — ensuring all 6 scoring domains have protocol representation

### DeFi Protocols (14)

#### Uniswap
- **Category:** DeFi
- **Launched:** November 2018
- **Chains:** Ethereum, Arbitrum, Optimism, Base, zkSync, Polygon
- **Contracts:** V2 Router, V3 SwapRouter02, UniversalRouter
- **Why included:** The dominant DEX by volume across all EVM chains. Uniswap invented the AMM model and remains the liquidity backbone of DeFi. Interaction with Uniswap is the single most common DeFi activity for any wallet.

#### Aave
- **Category:** DeFi
- **Launched:** January 2020
- **Chains:** Ethereum, Arbitrum, Optimism, Base, zkSync, Polygon
- **Contracts:** V3 Pool
- **Why included:** The largest lending protocol by TVL. Using Aave requires understanding supply/borrow mechanics, health factors, and liquidation risk — a meaningful step up from simple swaps.

#### Compound
- **Category:** DeFi
- **Launched:** September 2018
- **Chains:** Ethereum, Arbitrum, Base, Polygon
- **Contracts:** V3 Comet (USDC market)
- **Why included:** Pioneer of the lending protocol model. Compound governance (COMP token) also kicked off the "governance token" trend. V3 Comet represents the modern architecture.

#### Lido
- **Category:** DeFi
- **Launched:** December 2020
- **Chains:** Ethereum, Arbitrum, Optimism, Base, zkSync, Polygon
- **Contracts:** stETH, wstETH (mainnet); wstETH bridged (L2s)
- **Why included:** Dominant liquid staking protocol. Using Lido shows understanding of staking derivatives and DeFi composability (stETH is used as collateral across DeFi).

#### Curve
- **Category:** DeFi
- **Launched:** August 2020
- **Chains:** Ethereum, Arbitrum, Optimism, Base, zkSync, Polygon
- **Contracts:** Router NG, 3pool (mainnet)
- **Why included:** Specializes in stablecoin and like-asset swaps. Curve's veTokenomics model influenced dozens of protocols. Using Curve signals understanding of yield optimization and stable asset management.

#### 1inch
- **Category:** DeFi
- **Launched:** December 2020
- **Chains:** Ethereum, Arbitrum, Optimism, Base, zkSync, Polygon
- **Contracts:** AggregationRouterV6 (same CREATE2 address across chains, except zkSync)
- **Why included:** Leading DEX aggregator. Using an aggregator instead of trading directly shows price-optimization awareness — a DeFi sophistication signal.

#### SushiSwap
- **Category:** DeFi
- **Launched:** August 2020
- **Chains:** Ethereum, Arbitrum, Optimism, Polygon
- **Contracts:** V2 Router
- **Why included:** The first major Uniswap fork, historically significant as the protocol that proved the "vampire attack" model. Presence on Arbitrum and Optimism makes it relevant for multi-chain scoring.

#### Balancer
- **Category:** DeFi
- **Launched:** March 2020
- **Chains:** Ethereum, Arbitrum, Optimism, Base, Polygon
- **Contracts:** V2 Vault (same address across chains)
- **Why included:** Weighted pool AMM with unique multi-asset pool design. Balancer pools are used as building blocks by other protocols (Aura, Gyroscope), making interaction a signal of advanced DeFi usage.

#### MakerDAO
- **Category:** DeFi
- **Launched:** November 2017
- **Chains:** Ethereum only
- **Contracts:** DAI token, Pot (DSR)
- **Why included:** The original DeFi protocol and creator of DAI, the first decentralized stablecoin. MakerDAO predates "DeFi" as a term. Interaction shows awareness of the foundational layer of Ethereum DeFi.

#### GMX
- **Category:** DeFi
- **Launched:** September 2021
- **Chains:** Arbitrum only
- **Contracts:** V1 Router
- **Why included:** Dominant perpetual DEX on Arbitrum. Represents the derivatives/perps category of DeFi and provides Arbitrum-specific protocol coverage. Using GMX shows understanding of leverage trading mechanics onchain.

#### JediSwap (Starknet)
- **Category:** DeFi
- **Launched:** January 2023
- **Chains:** Starknet only
- **Contracts:** AMM Router
- **Why included:** One of the first AMMs on Starknet. Provides DeFi coverage for Starknet scoring. Early Starknet DeFi activity signals willingness to explore new execution environments (Cairo/STARK proofs).

#### mySwap (Starknet)
- **Category:** DeFi
- **Launched:** October 2022
- **Chains:** Starknet only
- **Contracts:** Core swap contract
- **Why included:** Early Starknet AMM that launched during testnet era. Provides additional Starknet DeFi signal and represents early adoption of the Starknet ecosystem.

#### 10KSwap (Starknet)
- **Category:** DeFi
- **Launched:** January 2023
- **Chains:** Starknet only
- **Contracts:** Router contract
- **Why included:** Concentrated liquidity AMM on Starknet. Multiple Starknet DEXes in the registry allow differentiation between users who tried one DEX vs. explored the ecosystem.

#### Ekubo (Starknet)
- **Category:** DeFi
- **Launched:** July 2023
- **Chains:** Starknet only
- **Contracts:** Core pool contract
- **Why included:** Most advanced Starknet DEX with singleton pool design (similar to Uniswap V4). Using Ekubo signals engagement with Starknet's maturing DeFi ecosystem. Also the newest protocol in the registry, making it relevant for early adoption scoring.

### Social Protocols (3)

#### ENS (Ethereum Name Service)
- **Category:** Social
- **Launched:** May 2017
- **Chains:** Ethereum only
- **Contracts:** Base Registrar, ETH Registrar Controller
- **Why included:** The identity layer of Ethereum. Registering an ENS name is one of the most common non-financial onchain actions and signals intent to have a persistent onchain identity.

#### Lens Protocol
- **Category:** Social
- **Launched:** February 2022
- **Chains:** Polygon only
- **Contracts:** LensHub Proxy
- **Why included:** The leading decentralized social graph. Using Lens shows engagement with web3 social beyond just financial transactions, indicating broader ecosystem participation.

#### Farcaster
- **Category:** Social
- **Launched:** January 2022
- **Chains:** Optimism only
- **Contracts:** IdRegistry
- **Why included:** Decentralized social network with significant developer community. Farcaster's onchain registration (via Optimism) provides a verifiable social identity signal distinct from Lens.

### Governance Protocol (1)

#### Safe (formerly Gnosis Safe)
- **Category:** Governance
- **Launched:** July 2018
- **Chains:** Ethereum only
- **Contracts:** SafeProxyFactory
- **Why included:** The dominant multi-sig wallet. Being a Safe signer or executor demonstrates high-trust roles in onchain organizations. Safe interactions are separately scored in the governance category's Safe Executions signal.

### Infrastructure Protocols (3)

#### Chainlink
- **Category:** Infrastructure
- **Launched:** June 2019
- **Chains:** Ethereum, Arbitrum, Optimism, Base, zkSync, Polygon
- **Contracts:** LINK token, Feed Registry (mainnet)
- **Why included:** Dominant oracle network. Interacting with Chainlink (staking LINK, using VRF, accessing price feeds) signals understanding of the infrastructure layer that DeFi depends on.

#### The Graph
- **Category:** Infrastructure
- **Launched:** December 2020
- **Chains:** Ethereum, Arbitrum
- **Contracts:** GRT token, L2 Staking
- **Why included:** Indexing and query layer for blockchain data. Using The Graph (delegating GRT, curating subgraphs) shows awareness of the data infrastructure powering dApps.

#### StarkGate (Starknet)
- **Category:** Infrastructure
- **Launched:** October 2022
- **Chains:** Starknet only
- **Contracts:** ETH bridge
- **Why included:** The canonical Starknet bridge. Bridging assets to Starknet is the entry point for the ecosystem and represents commitment to exploring a non-EVM execution environment.

### Gaming Protocols (3)

#### Treasure
- **Category:** Gaming
- **Launched:** September 2021
- **Chains:** Arbitrum only
- **Contracts:** MagicSwap Router
- **Why included:** The largest gaming ecosystem on Arbitrum. Treasure's MAGIC token and MagicSwap provide gaming-specific DeFi coverage. Gaming usage represents a distinct domain of onchain activity from financial DeFi.

#### Aavegotchi
- **Category:** Gaming
- **Launched:** March 2021
- **Chains:** Polygon only
- **Contracts:** Diamond (EIP-2535)
- **Why included:** DeFi-integrated gaming on Polygon. Aavegotchi combines NFTs with Aave's interest-bearing tokens, making it a cross-domain protocol that tests both gaming and DeFi understanding. Also provides Polygon-specific gaming coverage.

#### FrenPet
- **Category:** Gaming
- **Launched:** August 2023
- **Chains:** Base only
- **Contracts:** Diamond Proxy (V2), V1 Main Contract, V1 Game Manager, FP Token, pGOLD Token, NFT (6 contracts)
- **Why included:** The most active onchain game on Base. FrenPet is a virtual pet game using EIP-2535 Diamond architecture where players feed, battle (bonk), train, and evolve NFT pets. Its tokenomics are fully onchain — the FP token has a 4% transaction tax redistributed to active players, and mushroom purchases result in 100% token burn. FrenPet provides Base-specific gaming coverage and represents a distinct class of high-frequency single-chain gaming activity.

### Builder Tools (2)

#### Deterministic Deployment Proxy
- **Category:** Builder Tools
- **Launched:** April 2020
- **Chains:** Ethereum, Arbitrum, Optimism, Base, zkSync, Polygon
- **Contracts:** `0x4e59b44847b379578588920ca78fbf26c0b4956c` (same address on all chains)
- **Why included:** Enables CREATE2 deterministic deployment addresses. Using this proxy is a strong signal of advanced contract deployment — the deployer knows about address prediction and wants consistent addresses across chains.

#### CREATE2 Factory
- **Category:** Builder Tools
- **Launched:** January 2021
- **Chains:** Ethereum, Arbitrum, Optimism, Base, zkSync, Polygon
- **Contracts:** `0x13b0d85ccb8bf860b6b79af3029fca081ae9bef2` (same address on all chains)
- **Why included:** General-purpose CREATE2 factory. Complements the deterministic deployment proxy for wallets using different factory patterns. Together, these two builder tools identify wallets doing sophisticated multi-chain deployment strategies.

### Protocol Domain Summary

| Domain | Count | Purpose in Scoring |
|--------|-------|--------------------|
| **DeFi** | 14 | Core financial activity — swaps, lending, staking, perps, aggregation |
| **Social** | 3 | Identity and social graph — ENS names, Lens profiles, Farcaster IDs |
| **Governance** | 1 | Multi-sig and organizational wallets — Safe signers |
| **Infrastructure** | 3 | Oracles, indexing, bridges — the stack under DeFi |
| **Gaming** | 3 | Onchain gaming — distinct from financial DeFi usage |
| **Builder Tools** | 2 | CREATE2 factories — advanced deployment patterns |

---

## Real-World Calibration

These scores come from real wallets indexed via HyperSync (March 2026):

| Wallet | Txs | Chains | Score | Level |
|--------|-----|--------|-------|-------|
| vitalik.eth | 1,714 | 5 | 967 | Maxi |
| lefteris (0xd26a...) | 2,236 | 5 | 776 | Native |
| sassal.eth | 616 | 6 | 652 | Native |
| Binance hot wallet | 21,075 | 6 | 461 | Degen |
| hayden.eth | 12 | 1 | 205 | Tourist |
| brantly.eth | 7 | 1 | 60 | Normie |
| coinbase:deployer | 1 | 1 | 47 | Normie |

**Key observations:**
- vitalik.eth (967) doesn't reach 1000 even with 1,714 txs across 5 chains — the scoring model prevents trivial max-out
- Binance hot wallet (21,075 txs, 6 chains) scores only 461 — raw volume without governance, building, or protocol diversity doesn't score high
- hayden.eth (Uniswap founder) scores 205 with only 12 txs — most of his activity happens through contracts he deployed, not `from` address transactions
- The level distribution maps well to real archetypes: Maxi (ecosystem leader) > Native (power user) > Degen (active user) > Tourist (casual) > Normie (minimal)
