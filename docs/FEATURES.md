# ChainCred Features & Functionality

ChainCred scores Ethereum wallets based on what they actually do onchain — not what they hold. It indexes activity across 6 chains, computes a sybil-resistant expertise score from 0 to 1000, and makes the results available through a REST API, a web explorer, and onchain attestations.

This document describes what's currently built and working.

---

## Supported Chains

ChainCred indexes wallet activity across six EVM networks:

- **Ethereum** (mainnet)
- **Arbitrum One**
- **Optimism**
- **Base**
- **zkSync Era**
- **Polygon**

The indexer uses [HyperSync](https://docs.envio.dev/docs/HyperSync/overview) for fast historical backfill with automatic pagination across all chains.

---

## Expertise Score

Every wallet gets a single score from **0 to 1000**, computed from five categories. Each category uses multiple signals to produce a raw score (0-1000), which is then weighted and summed. The final score is multiplied by a **sybil confidence multiplier** (0.0 to 1.0) to discount suspected bot/farm wallets.

### Builder Score (30%)

Measures onchain creation activity with four signals that reward volume, cross-chain fluency, constructor sophistication, and builder-focused behavior.

| Signal | Points | Cap |
|--------|--------|-----|
| Contract deployments | 60 per contract | 420 |
| Multi-chain deployments | 80 per chain | 320 |
| Constructor complexity | sqrt(avg bytes) x 15 | 200 |
| Deployment focus ratio | ratio x 800 | 160 |

Caps sum to 1100 — intentionally over 1000 since no wallet can max all signals simultaneously (the focus ratio drops as total transactions increase). Final capped at 1000.

### Governance Score (25%)

Measures DAO participation depth and quality. The indexer classifies governance interactions into four subtypes (vote, propose, delegate, queue/execute) for granular scoring.

| Signal | Points | Cap |
|--------|--------|-----|
| DAO votes cast | 40 per vote | 400 |
| DAOs participated in | 120 per DAO | 360 |
| Governance proposals authored | 150 per proposal | 150 |
| Delegation events | 30 per event | 90 |

Proposals are the highest-value signal — creating proposals is rarer and more meaningful than voting.

### Temporal Score (20%)

Time-weighted consistency. The hardest signal to fake.

| Signal | Points | Cap |
|--------|--------|-----|
| Wallet age | 100 per year | 400 |
| Bear market activity | 10 per bear-market tx | 300 |
| Consistency (active months / wallet age) | ratio x 300 | 300 |

Three bear market windows are tracked: Nov 2018 - Mar 2019, May 2021 - Nov 2021, and Nov 2022 - Jan 2023. Transactions during these periods are counted separately because activity during market downturns is a strong signal of genuine engagement.

### Protocol Diversity Score (15%)

Measures breadth of protocol engagement across protocols, chains, and domains.

| Signal | Points | Cap |
|--------|--------|-----|
| Unique protocols used | 35 per protocol | 350 |
| Chains active on | 50 per chain | 250 |
| Protocol category coverage | 80 per category | 400 |

Six protocol categories are tracked: DeFi, Social, Governance, Infrastructure, Gaming, and Builder Tools. Covering more domains shows broader expertise than depth in a single category.

### Complexity Score (10%)

Measures sophistication of individual interactions.

| Signal | Points | Cap |
|--------|--------|-----|
| Transaction volume | 3 per tx | 300 |
| Failed transaction ratio | ratio x 2000 | 300 |
| Average calldata size | sqrt(avg bytes) x 20 | 400 |

Failed transactions contribute positively — the PRD notes "failures = pushing limits." A wallet that has never failed a transaction despite hundreds of interactions is suspicious (handled by sybil detection), while a healthy failure rate shows genuine experimentation.

### How scoring works in practice

A wallet that has deployed 5 contracts across 2 chains with 15,000 total constructor bytes and 500 total transactions, cast 10 votes across 3 DAOs, authored 1 proposal, delegated 4 times, has been active for 5 years with 30 bear-market txs and 48 active months, used 10 protocols across 4 chains covering 3 categories, and has 10% failure rate and 250-byte average calldata would score roughly:

- Builder: min(300 + 160 + 200 + 8, 1000) = 668 x 0.30 = **200**
- Governance: min(400 + 360 + 150 + 90, 1000) = 1000 x 0.25 = **250**
- Temporal: min(400 + 300 + 240, 1000) = 940 x 0.20 = **188**
- Protocol Diversity: min(350 + 200 + 240, 1000) = 790 x 0.15 = **119**
- Complexity: min(300 + 200 + 316, 1000) = 816 x 0.10 = **82**

**Total: 839** (before sybil multiplier)

---

## Protocol Detection

The indexer recognizes **16 protocols** across all 6 chains and maps contract interactions to named protocols:

| Protocol | Type | Chains |
|----------|------|--------|
| Uniswap | DeFi | All 6 |
| Aave | DeFi | All 6 |
| Compound | DeFi | ETH, Arbitrum, Base, Polygon |
| Lido | DeFi | All 6 |
| Curve | DeFi | All 6 |
| 1inch | DeFi | All 6 |
| SushiSwap | DeFi | ETH, Optimism, Polygon, Arbitrum |
| Balancer | DeFi | ETH, Optimism, Polygon, Base, Arbitrum |
| MakerDAO | DeFi | Ethereum only |
| GMX | DeFi | Arbitrum only |
| ENS | Social | Ethereum only |
| Lens Protocol | Social | Polygon only |
| Farcaster | Social | Optimism only |
| Safe | Governance | Ethereum only |
| Chainlink | Infrastructure | All 6 |
| The Graph | Infrastructure | Ethereum, Arbitrum |

When a wallet interacts with any known contract address, it gets credited for that protocol. The protocol's category (DeFi, Social, etc.) is also tracked for the cross-domain coverage signal in the protocol diversity score.

---

## Governance Tracking

The indexer detects **22 governance contracts** across Ethereum, Arbitrum, Optimism, and Polygon. It classifies 11 governance function signatures into four subtypes:

- **Voting:** `castVote`, `castVoteWithReason`, `castVoteWithReasonAndParams`, `castVoteBySig`, `castVoteWithReasonAndParamsBySig`
- **Proposals:** `propose` (Governor and GovernorBravo variants)
- **Delegation:** `delegate`, `delegateBySig`
- **Lifecycle:** `queue`, `execute`

Each subtype is scored differently — proposals and delegation events are tracked as separate signals from votes.

Tracked DAOs include ENS, Uniswap, Aave, Compound, MakerDAO, Arbitrum DAO, Optimism Collective, Lido, Curve, Gitcoin, Safe, and others.

---

## Sybil Detection

Every wallet is analyzed for bot-like behavior using seven heuristics. Each heuristic that fires reduces the wallet's confidence multiplier:

### Temporal Clustering (penalty: -40%)
Detects wallets with compressed activity windows. If a wallet averages more than 20 transactions per day and is less than 90 days old, it gets flagged. A real user with 500 transactions over 3 years is normal; 500 transactions in 2 weeks is suspicious.

### Action Repetition (penalty: -30%)
Detects single-protocol farming. If a wallet has over 100 transactions but uses fewer than 3 protocols on a single chain, it gets flagged. Genuine users tend to interact with a variety of protocols over time.

### Zero Failure Rate (penalty: -20%)
Detects bot-like perfection. If a wallet has over 200 transactions and has never had a single failed transaction, it gets flagged. Real users inevitably encounter reverts, out-of-gas errors, and other failures. A perfect success rate at high volume suggests automated pre-simulation.

### Funding Graph Clustering (penalty: -50%)
Detects sybil cluster coordinators — wallets that distribute funds to many recipients. If a wallet has sent to more than 10 unique addresses but uses fewer than 3 protocols, it gets flagged. Sybil farms are typically funded by a single source wallet that distributes to 10+ wallets with similar low-diversity behavior.

### Cross-Chain Mirroring (penalty: -60%)
Detects programmatic behavior replication across chains. The heuristic groups a wallet's protocol interactions by chain and checks if 3 or more chains share an identical protocol set. Automated sybil farms often execute the same sequence of protocol interactions across multiple chains simultaneously — real users develop different habits per chain.

### CEX Withdrawal Freshness (graduated penalty: up to -30%)
Flags newly created wallets funded from centralized exchanges. The penalty graduates linearly from 30% (brand new) to 0% (30+ days old). A wallet that is 15 days old gets a 15% penalty. Wallets older than 30 days are not affected. This catches fresh sybil accounts while giving legitimate new users time to establish history.

### Perfect Gas Patterns (penalty: -15%)
Detects uniform gas pricing that suggests automation. If a wallet has 50+ transactions and fewer than 5% distinct gas prices relative to total transactions, it gets flagged. Real users encounter varying network conditions resulting in diverse gas prices, while bots typically hardcode or use a narrow range of gas settings.

### How penalties combine

Penalties are multiplicative. A wallet that triggers temporal clustering, action repetition, and cross-chain mirroring gets:

```
confidence = 1.0 x (1 - 0.40) x (1 - 0.30) x (1 - 0.60) = 0.168
```

A final expertise score of 700 would become 700 x 0.168 = **118** after sybil discounting.

Wallets are never banned — just discounted. The confidence score and detected flags are always visible so users can understand their rating.

---

## Badges

Seven expertise badges recognize specific achievements. Each maps to a concrete onchain behavior:

| Badge | Criteria | Status |
|-------|----------|--------|
| Builder | 3+ deployed contracts | Active |
| Governor | Participated in 5+ DAOs | Active |
| Explorer | Used 20+ unique protocols | Active |
| OG | First transaction before 2020 | Active |
| Multichain | Active on 4+ chains | Active |
| Trusted | Multi-sig signer for 2+ orgs | Planned |
| Power User | Top 5% protocol diversity + complexity | Planned |

Badges are evaluated dynamically based on the wallet's indexed activity. The "Trusted" and "Power User" badges require additional data sources that aren't yet integrated.

---

## API

The REST API runs on [Hono](https://hono.dev/) (Bun runtime) and serves all scoring data. Base URL: `http://localhost:3001/v1`

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/v1/score/:address` | Full score with category breakdown |
| GET | `/v1/badges/:address` | Badge evaluation for a wallet |
| GET | `/v1/sybil/:address` | Sybil confidence score and detected flags |
| GET | `/v1/attestation/:address` | EAS attestation lookup |
| POST | `/v1/verify` | Verify a score against the onchain Merkle root |
| GET | `/v1/leaderboard` | Top wallets by score (with category and pagination filters) |
| GET | `/v1/stats` | Platform statistics (wallets scored, chains indexed) |
| GET | `/v1/proof/:address` | Merkle proof for a wallet's score |

### Rate limiting

100 requests per 60 seconds per IP address. Returns `429 Too Many Requests` when exceeded.

### Caching

All GET routes are cached in Redis with TTLs appropriate to how often the data changes:

- Score, badges, sybil: 5 minutes
- Attestation, proof: 10 minutes
- Leaderboard, stats: 1 minute

If Redis is unavailable, the API continues working without caching.

### Example: Get a wallet's score

```
GET /v1/score/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

```json
{
  "totalScore": 789,
  "sybilMultiplier": 1.0,
  "breakdown": {
    "builder": { "raw": 500, "weighted": 150 },
    "governance": { "raw": 1000, "weighted": 250 },
    "temporal": { "raw": 940, "weighted": 188 },
    "protocolDiversity": { "raw": 790, "weighted": 119 },
    "complexity": { "raw": 816, "weighted": 82 }
  }
}
```

---

## Web Explorer

A SvelteKit frontend at `http://localhost:5173` provides a visual interface:

- **Home page** — Search any wallet by address, see platform stats
- **Score page** — SVG radar chart showing all 5 category scores as a filled polygon, with per-category color-coded dots, axis labels, and concentric grid rings. Includes badge display and sybil confidence indicator. Shows error states with retry buttons and loading skeletons while data loads.
- **Expertise card** — Displays total score with animated progress bar, raw score and sybil percentage. Includes share buttons: copy link, share on X (Twitter), and cast on Warpcast (Farcaster).
- **Leaderboard** — Top wallets with category filtering (overall, builder, governance, temporal, protocol diversity, complexity). Sorted server-side by category raw score when a specific category is selected. Shows inline score progress bars and a category-specific column with raw scores when filtering. Supports pagination.
- **Wallet connection** — Connect MetaMask or any EIP-1193 wallet via the nav bar

The frontend is mobile-responsive with horizontal scrolling on the leaderboard table and stacked layouts on smaller screens.

---

## Onchain Verification

### Smart Contracts (Solidity 0.8.24, Foundry)

Three contracts handle onchain verification:

**ChainCredRegistry** — Central configuration contract. Stores EAS schema UIDs, manages admin roles, and maintains an exclusion list for protocol-owned wallets and bots. Pausable by admins, unpausable by owner.

**ScoreMerkleRoot** — Publishes a weekly Merkle root so anyone can verify a wallet's score without trusting ChainCred's API. The `verifyScore(address, score, proof)` function validates a wallet's score against the current tree. Uses OpenZeppelin's double-hash leaf pattern for security.

**BadgeResolver** — An EAS SchemaResolver that validates badge attestations. Only accepts attestations from the authorized ChainCred attestor and only for the 7 defined badge types.

### Merkle Proofs

A weekly Merkle tree is generated from all scored wallets. Each leaf encodes `keccak256(keccak256(abi.encode(address, score)))` matching OpenZeppelin's standard. Proofs are stored in PostgreSQL and served via the `/v1/proof/:address` endpoint.

The Merkle root is published onchain via `ScoreMerkleRoot.updateMerkleRoot()`, allowing trustless score verification.

### EAS Attestations

ChainCred queries the Ethereum Attestation Service (EAS) GraphQL API to look up existing attestations for any wallet. The attestation schema includes the wallet address, expertise score, badges, a score breakdown CID, and a schema version.

---

## Infrastructure

### Database

PostgreSQL stores indexed wallet activity and Merkle proofs. The schema tracks:

- `wallet_activity` — per-wallet aggregated data: address, first tx timestamp, total transactions, contracts deployed, deployment chains, deployment calldata bytes, unique protocols, chains active, governance votes, DAOs participated, proposals created, delegation events, bear market transactions, active months, protocol categories, failed transactions, total calldata bytes, recipient addresses, chain:protocol pairs, gas price set
- `merkle_proofs` — per-wallet Merkle proofs (address, score, proof array, root hash, creation timestamp)

Migrations run automatically via `bun run migrate`.

### Docker

**Development:** `docker compose up` starts PostgreSQL, Redis, runs migrations, and launches the API (with hot reload) and indexer using bind-mounted source code.

**Production:** `docker compose --profile prod up` builds optimized images using a multi-stage Dockerfile (`oven/bun:1-alpine` base). No bind mounts — source is copied into the image.

**Merkle generation:** `docker compose run --profile tools merkle-gen` runs the weekly tree generation.

### CI/CD

**GitHub Actions** runs three workflows:

- **CI** (on push/PR) — Typechecks all 5 TypeScript packages, runs 56 tests (40 scoring + 16 API), builds and tests Solidity contracts, checks Solidity formatting
- **Weekly Merkle** (Monday 06:00 UTC, or manual) — Generates the Merkle tree against a PostgreSQL service and outputs the root for onchain submission
- **Deploy Contracts** (manual trigger) — Deploys all 3 contracts to Sepolia or mainnet via Foundry with Etherscan verification. Supports dry-run mode.

### Testing

56 automated tests cover:

- **Scoring engine** (40 tests) — Category calculators with multi-signal formulas, badge evaluation, sybil detection with all 7 heuristics (temporal clustering, action repetition, zero failure rate, funding graph, cross-chain mirroring, CEX freshness, gas patterns), combined penalty math, enriched signal contribution tests, builder multi-signal tests
- **API** (16 tests) — Health check, address validation, CORS, rate limiting, all route responses. Tests work with or without PostgreSQL/Redis running.

---

## Configuration

All configuration is via environment variables. See `.env.example`:

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://chaincred:chaincred@localhost:5432/chaincred` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `VITE_API_URL` | Frontend API base URL | `http://localhost:3001/v1` |
| `PORT` | API server port | `3001` |
| `SCORE_MERKLE_ADDRESS` | Deployed ScoreMerkleRoot contract | — |
| `EAS_GRAPHQL_URL` | EAS GraphQL endpoint | — |
| `CHAINCRED_SCHEMA_UID` | EAS schema UID for scores | — |
