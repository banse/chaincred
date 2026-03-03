# ChainCred — Product Requirements Document
**Version:** 0.1 (Napkin → Genius)
**Date:** 2026-03-03
**Status:** Draft

---

## 1. Executive Summary

ChainCred is an onchain expertise reputation layer for Ethereum and EVM-compatible networks. It produces composable, sybil-resistant reputation scores based on *what wallets actually do onchain* — not what they hold. Scores are emitted as onchain attestations (EAS) and consumed by DAOs, protocols, hiring platforms, and hackathon organizers to verify genuine participation and expertise.

**One line:** GitHub contribution graph meets Ethereum — your wallet's expertise, provable.

---

## 2. Problem

### 2.1 The Core Problem
The Ethereum ecosystem has no credible, composable way to distinguish:
- Experienced builders from airdrop farmers
- Genuine DAO contributors from governance attackers
- Real protocol users from sybil accounts

Existing solutions are broken:
| Solution | Problem |
|----------|---------|
| Token-weighted governance | Plutocracy — wealth ≠ expertise |
| Gitcoin Passport | Proves humanity, not expertise |
| On-chain portfolio value | Wealth signal, not skill signal |
| POAPs | Heavily farmed, attendance ≠ knowledge |
| Social reputation (Twitter followers) | Off-chain, unverifiable, gameable |

### 2.2 Who Feels This Pain
- **DAOs** — can't distinguish quality contributors from governance attackers
- **Protocols** — want to reward power users, can't identify them without wealth bias
- **Hackathon organizers** — need to verify participant legitimacy
- **Web3 employers/grants** — need verifiable proof of onchain experience
- **Builders themselves** — have years of onchain history with no way to surface it

---

## 3. Solution

### 3.1 What ChainCred Does
Indexes the complete onchain history of any EVM wallet and produces:
1. **An Expertise Score** (0–1000) — weighted composite of all signal categories
2. **Category Badges** — specialist attestations per domain
3. **An Expertise Card** — shareable visual artifact for Farcaster/social
4. **An EAS Attestation** — composable, onchain, consumable by any protocol

### 3.2 What ChainCred Explicitly Does NOT Do
- ❌ Measure portfolio value or holdings
- ❌ Track trading volume or P&L
- ❌ Consider token price or NFT floor price
- ❌ Reward passive holding of any duration
- ❌ Issue soulbound tokens (attestations are non-transferable but revocable)

---

## 4. Signal Framework

### 4.1 Signal Categories & Weights

```
Expertise Score (0–1000) =
  Builder Score        × 0.30
  Governance Score     × 0.25
  Temporal Score       × 0.20
  Protocol Diversity   × 0.15
  Complexity Score     × 0.10
  × Sybil Confidence Multiplier (0.0–1.0)
```

### 4.2 Builder Score (30%)

Measures onchain creation and contribution activity.

| Signal | Weight | Notes |
|--------|--------|-------|
| Contract deployments | High | +score per unique deployed contract |
| Deployed contracts with external users | Very High | Multiplier: unique callers of your contracts |
| Verified source code on Etherscan | High | Deliberate act, not automated |
| Factory / proxy pattern usage | Medium | Architectural sophistication |
| CREATE2 deployments | Medium | Advanced deployment knowledge |
| ERC-4337 bundler / paymaster activity | Medium | Account abstraction ecosystem |
| Contracts deployed that are still active (>6mo) | High | Longevity signal |

### 4.3 Governance Score (25%)

Measures DAO participation depth and quality.

| Signal | Weight | Notes |
|--------|--------|-------|
| On-chain votes across ≥3 DAOs | Very High | Multi-DAO participation filters tourists |
| Governance proposals authored | Very High | Creation > consumption |
| Multi-sig (Safe) signer participation | High | Trusted by others = social proof |
| Being delegated voting power | High | Community endorsement signal |
| Voting against majority occasionally | Medium | Independent thinking; non-herding |
| Delegate relationships (delegating to others) | Medium | Ecosystem participation |
| Treasury execution transactions | High | Operational governance |

**Governance Depth Bonus:** Wallets active in governance during contentious votes (low voter turnout periods) get a multiplier — showing up when it matters.

### 4.4 Temporal Score (20%)

Time-weighted consistency. The hardest signal to fake.

| Signal | Weight | Notes |
|--------|--------|-------|
| Wallet age (first tx date) | High | OG bonus for pre-2021 wallets |
| Bear market activity (defined periods) | Very High | Nov 2018–Mar 2019, Nov 2022–Jan 2023, etc. |
| Activity consistency (months active / wallet age) | High | Distributed activity >> burst farming |
| Cross-cycle persistence | Very High | Active in 2+ distinct bull/bear cycles |
| Activity entropy | Medium | Irregular timing = human, regular = bot |

**Bear Market Periods (High Signal Windows):**
- Nov 2018 – Mar 2019
- May 2021 – Nov 2021
- Nov 2022 – Jan 2023
- (future periods to be added dynamically)

### 4.5 Protocol Diversity Score (15%)

Measures breadth and depth of protocol engagement.

| Signal | Weight | Notes |
|--------|--------|-------|
| Unique protocols interacted with | High | Map contracts → protocols via registry |
| Cross-domain coverage | High | DeFi + Gov + NFT + Social + Gaming |
| L2 fluency (3+ chains with history) | Medium | Bridge usage, native L2 activity |
| Niche/early protocol usage | High | Using protocols before they go mainstream |
| Cross-chain governance | High | L2 DAO participation |

**Protocol Categories (for badge assignment):**
- DeFi (AMMs, lending, yield, derivatives)
- Governance (DAOs, multi-sigs, delegation)
- Infrastructure (bridges, oracles, identity)
- Social (Lens, Farcaster, ENS ecosystem)
- Gaming / onchain games
- Builder tools (Foundry, Hardhat deployments, testnet usage)

### 4.6 Transaction Complexity Score (10%)

Measures sophistication of individual interactions.

| Signal | Weight | Notes |
|--------|--------|-------|
| Average calldata size | Medium | Proxy for interaction complexity |
| Internal call depth | Medium | Multi-step DeFi > simple swap |
| Failed transaction ratio (on complex contracts) | High | Failures = pushing limits (good) |
| EIP-712 typed signing history | Medium | Protocol-aware behavior |
| Flashloan usage | High | Advanced DeFi composability |
| MEV-adjacent activity (non-bot) | Medium | Arbitrage attempts, etc. |
| Smart contract wallet usage (Safe, ERC-4337) | Medium | Security sophistication |

---

## 5. Sybil Resistance

### 5.1 Confidence Multiplier
Every wallet receives a Sybil Confidence score (0.0–1.0) that multiplicatively scales the Expertise Score. Wallets aren't banned — they're discounted. Transparent and appealable.

### 5.2 Sybil Detection Heuristics

| Signal | Method | Penalty |
|--------|--------|---------|
| Temporal clustering | >80% activity in <14-day windows | -40% confidence |
| Action repetition | Same tx pattern >5x (claim→bridge→swap) | -30% confidence |
| Funding graph clustering | Source wallet funds >10 wallets | -50% confidence |
| Cross-chain mirroring | Identical behavior on 3+ chains simultaneously | -60% confidence |
| CEX withdrawal freshness | Wallet age <30 days from first tx | Graduated ramp-up |
| Zero failure rate on complex contracts | No failed txs despite 50+ complex interactions | -20% confidence |
| Perfect gas price patterns | Gas always exactly X gwei, never human-messy | -15% confidence |

### 5.3 Funding Graph Analysis
Use graph traversal to identify wallet clusters funded by the same source. Clusters of >10 wallets with similar behavioral patterns get flagged. Individual wallets in a cluster can appeal with off-chain proof (e.g., KYC, social attestation).

### 5.4 Edge Cases

| Case | Handling |
|------|---------|
| Multi-sig wallets (Safe) | Score the Safe + attribute to individual signers by participation |
| Delegate-only voters | Delegation is scored; direct voting gets higher weight |
| Protocol-owned wallets (treasury, etc.) | Exclude from individual reputation via registry |
| MEV bots | Detect via MEV-Boost data; exclude from human scoring |
| Hardware wallet patterns | No adjustment; HW usage is actually a positive signal |

---

## 6. Output: Expertise Badges

Seven composable badges, each an EAS attestation:

| Badge | Criteria | Color |
|-------|----------|-------|
| 🏗️ **Builder** | 3+ deployed contracts with external users | Orange |
| 🗳️ **Governor** | Voted in 5+ DAOs, authored 1+ proposal | Purple |
| 🧪 **Explorer** | 20+ unique protocols across 3+ domains | Teal |
| ⛰️ **OG** | Pre-2020 wallet, bear market activity | Gold |
| 🌐 **Multichain** | Active on 4+ L2s with governance/build activity | Blue |
| 🔐 **Trusted** | Multi-sig signer for 2+ orgs, high delegation | Silver |
| ⚡ **Power User** | Top 5% protocol diversity + complexity | Red |

Badges are stackable. The Expertise Score is the holistic number; badges provide categorical context.

---

## 7. Technical Architecture

### 7.1 Indexing Layer
- **Ethereum mainnet + major L2s:** Arbitrum, Optimism, Base, zkSync Era, Starknet, Polygon
- **Indexer:** Custom subgraph (The Graph) + Hypersync for high-speed historical backfill
- **Protocol registry:** Maintained mapping of contract addresses → protocol names + categories
- **Update cadence:** Real-time for new transactions; full recalculation weekly

### 7.2 Scoring Engine
- Off-chain computation (too complex for onchain)
- Score + breakdown stored in a Merkle tree
- Users claim their attestation by submitting a Merkle proof
- Score is verifiable without trusting ChainCred (open Merkle root published onchain)

### 7.3 Attestation Layer
- **EAS (Ethereum Attestation Service)** on Ethereum mainnet + L2s
- Schema: `{ walletAddress, expertiseScore, badges[], scoreBreakdown (IPFS CID), timestamp, schemaVersion }`
- Attestations are revocable and re-issued on score updates
- Badge attestations are separate from the composite score attestation

### 7.4 API
```
GET  /v1/score/:address              → Full score + breakdown
GET  /v1/badges/:address             → Active badges
GET  /v1/sybil/:address              → Confidence multiplier + flags
GET  /v1/attestation/:address        → EAS attestation UID
POST /v1/verify                      → Submit Merkle proof for onchain attestation
GET  /v1/leaderboard?category=builder → Top wallets by category
WS   /v1/stream/:address             → Real-time score updates
```

### 7.5 Smart Contracts
- `ChainCredRegistry.sol` — tracks schema UIDs, paused state, admin
- `ScoreMerkleRoot.sol` — publishes weekly Merkle root for trustless verification
- `BadgeResolver.sol` — EAS resolver for badge attestations (enforces criteria)

### 7.6 Tech Stack
- **Indexing:** TypeScript + Hypersync + The Graph
- **Scoring:** Python (data pipeline) → TypeScript API
- **Contracts:** Solidity + Foundry
- **API:** Bun + Hono
- **Frontend:** SvelteKit + TailwindCSS
- **Database:** PostgreSQL (scores) + Redis (cache) + IPFS (score breakdowns)
- **Attestations:** EAS SDK

---

## 8. Product Surface

### 8.1 Explorer (Web App)
- Enter any wallet address → see full score breakdown
- Visual "expertise radar" chart across all categories
- Timeline view: activity history, badge unlock dates
- Sybil confidence indicator with explanation

### 8.2 Expertise Card (Shareable)
- Auto-generated SVG/PNG card: score, top badges, activity timeline
- Optimized for Farcaster frames (interactive)
- One-click share to Warpcast, Twitter/X
- Embeddable widget for personal sites

### 8.3 Verification Widget (for DAOs/Protocols)
```html
<chaincred-verify wallet="0x..." min-score="500" required-badges="builder,governor" />
```
Drop-in embed for governance UIs, hackathon platforms, grant applications.

### 8.4 API (for Integrators)
- Rate-limited free tier: 1,000 lookups/day
- Paid tiers for protocols and DAOs
- Webhook support for score change events

---

## 9. Go-to-Market

### 9.1 Beachhead: DAO Governance Tools
Target: Tally, Snapshot, Agora — integrate ChainCred score as an optional governance weight modifier. Start with 2–3 willing DAOs as design partners.

### 9.2 Growth Loop
1. Wallet checks score → shares Expertise Card on Farcaster
2. Farcaster frame lets others check their score in-app
3. Protocol integrates widget → more wallets discover ChainCred
4. More integrations → more value for high-scoring wallets → more sharing

### 9.3 Launch Sequence
1. **Private beta** — invite-only for known builders (ENS holders, Gitcoin grant recipients)
2. **Farcaster launch** — Expertise Card frame goes viral
3. **DAO integrations** — 3 design partner DAOs go live
4. **Public API** — open for protocol integrations
5. **Grant round** — apply to Optimism RPGF, ENS ecosystem grants, Ethereum Foundation

### 9.4 Revenue Model
| Stream | Model | Target |
|--------|-------|--------|
| API access | Freemium SaaS ($99–$999/mo) | Protocols, tools |
| DAO licensing | Annual license per DAO | $5k–$50k/yr |
| White-label | Custom scoring for protocols | $10k+ setup |
| Premium wallet profiles | Optional $20/yr for advanced analytics | Individual users |

---

## 10. Competitive Landscape

| Project | Focus | Gap |
|---------|-------|-----|
| Gitcoin Passport | Sybil resistance / humanity | Not about expertise |
| Orange Protocol | Reputation aggregation | Multi-source, not expertise-focused |
| Karma DAO | DAO contributor reputation | Narrow scope, off-chain data |
| Degenscore | Onchain activity score | Includes wealth signals, less principled |
| Phi Protocol | Onchain art/credentials | Art/aesthetic layer, not scoring |

**ChainCred's moat:** Expertise-first (no wealth signals), composable EAS attestations, open Merkle verification, and a principled sybil model. As score history accumulates, the historical depth becomes impossible to replicate.

---

## 11. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Sybils reverse-engineer scoring | Medium | Obfuscate exact weights; add behavioral signals |
| Protocol addresses score wrong | Medium | Curated exclusion registry; community flagging |
| Score gaming via intentional fails | Low | Pattern detection; contextual failure analysis |
| EAS deprecation / migration | Low | Abstract attestation layer; multi-schema support |
| Ethereum L1 data cost | Medium | Use L2s for attestations; Merkle verification for cost efficiency |
| Privacy concerns (doxxing via score) | Medium | Score wallets, not identities; user-controlled disclosure |

---

## 12. Success Metrics (6-month targets)

- 10,000 unique wallets scored
- 5 protocol/DAO integrations live
- 500 daily active lookups via API
- 3 badges claimed by >1,000 wallets each
- Sybil false positive rate <2% (validated by community audit)
- $10k MRR from API subscriptions

---

## 13. Resolved Design Decisions

### 13.1 Public scores vs. opt-in disclosure?
**Decision: Public by default, EAS attestation is opt-in.**

Wallet data is already public — ChainCred reveals nothing that isn't already on-chain. Scores are computed and queryable permissionlessly. The EAS attestation (the portable, composable credential) is only minted on user request. This preserves composability while giving wallets control over when their score is "official."

UX hook: "You've earned the Builder badge — claim it."

### 13.2 L2-native wallets with minimal L1 history?
**Decision: L2s are first-class. L1 supremacy is not baked in.**

Each chain contributes independently to the score. L1 is not the baseline. A wallet deeply active on Base, Arbitrum, and Optimism with governance history scores fully. The OG bonus remains L1-specific (pre-2021 Ethereum activity is genuinely rare) but everything else is chain-agnostic. New wallets get an "L2 Native" flag — context, not penalty.

The scoring engine is chain-agnostic from v1.

### 13.3 Community governance of scoring weights?
**Decision: No governance until month 12+. Hardcoded v1 weights, published openly.**

Opening weights to community vote on day one creates an immediate attack surface — constituencies lobby for signals that benefit their wallet type, farming metas shift within days of any change. 

Sequence:
1. Ship with hardcoded v1 weights (fully transparent)
2. Run shadow model alongside — show diffs publicly
3. Governance after 12 months with sufficient validation data
4. Weight changes on a slow clock — quarterly max, 30-day preview window

Transparency yes. Premature governance no.

### 13.4 Should ChainCred have a token?
**Decision: No token. Ever, unless there is a genuine decentralization need that cannot be solved another way.**

A token makes the score a farming target and destroys the mission. ChainCred's value is in being trusted infrastructure — like ENS or EAS, neither of which needed a token to become canonical. Revenue is captured through API/licensing.

If decentralization of scoring weights is ever needed (see 13.3), use a non-transferable governance NFT airdropped to verified contributors — no market price, no speculation.

### 13.5 Wallet migration / account abstraction address changes?
**Decision: EAS linking attestations with dual-signing and an 80% score aggregation discount.**

A wallet can attest "address B is a migration of address A" — both addresses must co-sign the attestation. ChainCred aggregates scores across linked addresses at 80% (the discount prevents gaming via purchasing old high-score wallets). Self-sovereign, opt-in, mirrors ENS reverse record model. Future-proofs for ERC-4337 mainstream adoption.

### 13.6 Appeal process for sybil false positives?
**Decision: GitHub issue + signed message → manual review queue. Score frozen pending review, not zeroed.**

Binary bans are wrong and erode trust. Disputed wallets have their score frozen (not deleted), submit a signed appeal via GitHub, and enter a manual review queue. Score resumes or is adjusted after review. SLA: 14 days.

### 13.7 Protocol-owned wallets and bots?
**Decision: Curated exclusion registry, open for community submissions, maintained by ChainCred team initially.**

Mirrors ENS's DNS registry model. Treasury wallets, protocol-owned liquidity, known MEV bots, and bridge contracts are registered as excluded. Community can submit exclusion requests via GitHub PR. Registry is published onchain for transparency.

### 13.8 Integration threshold validation?
**Decision: 2–3 design partner DAOs set real minimum scores for real governance actions in private beta.**

The scoring model is only validated when real humans make real decisions with it. Design partners set thresholds against their own judgment of who counts as a genuine contributor. Discrepancies drive scoring model iteration before public launch.

---

*Built with IdeaRalph + ChainCred brainstorming session, 2026-03-03*
*Design decisions locked 2026-03-03*
