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

Measures onchain creation activity with eight signals that reward volume, cross-chain fluency, constructor sophistication, builder-focused behavior, account abstraction infrastructure, and verified source code.

| Signal | Points | Cap |
|--------|--------|-----|
| Contract deployments | 60 per contract | 420 |
| Multi-chain deployments | 80 per chain | 320 |
| Constructor complexity | sqrt(avg bytes) x 15 | 200 |
| Deployment focus ratio | ratio x 800 | 160 |
| CREATE2 deployments | 50 per CREATE2 deploy | 150 |
| ERC-4337 operations | 40 per handleOps call | 200 |
| Deployment longevity | 60 per 6-month period since first deploy | 180 |
| Verified source deployments | 80 per verified contract | 240 |

ERC-4337 operations detect `handleOps` and `handleAggregatedOps` calls to EntryPoint contracts — operating AA infrastructure (bundler/paymaster activity) is a strong builder signal. Deployment longevity rewards wallets with long-standing deployed contracts — 60 points per 6-month period since their first deployment. Verified source detection uses the Etherscan V2 API to check if deployed contracts have verified source code — publishing source is a strong quality signal. Caps sum to 1870 — intentionally over 1000 since no wallet can max all signals simultaneously. Final capped at 1000.

### Governance Score (25%)

Measures DAO participation depth and quality. The indexer classifies governance interactions into five subtypes (vote, propose, delegate, queue, execute) for granular scoring.

| Signal | Points | Cap |
|--------|--------|-----|
| DAO votes cast | 40 per vote | 400 |
| DAOs participated in | 120 per DAO | 360 |
| Governance proposals authored | 150 per proposal | 150 |
| Delegation events | 30 per event | 90 |
| Treasury execution events | 60 per queue/execute | 120 |
| Cross-chain governance | 50 per governance chain | 150 |
| Independent voting | 40 per against/abstain vote | 120 |
| Safe multi-sig executions | 50 per execTransaction | 200 |
| Reasoned votes | 50 per castVoteWithReason | 150 |

Proposals are the highest-value signal — creating proposals is rarer and more meaningful than voting. Treasury execution (queue/execute calls) indicates deep DAO operational involvement. Cross-chain governance rewards wallets that participate in DAOs across multiple networks. Independent voting parses the `support` parameter from castVote calldata — votes with support=0 (against) or support=2 (abstain) indicate independent thinking rather than rubber-stamping. Safe multi-sig detection identifies `execTransaction` (selector `0x6a761202`) calls — wallets that co-sign and execute Safe multi-sig transactions demonstrate collaborative governance. Reasoned votes track `castVoteWithReason`, `castVoteWithReasonAndParams`, and `castVoteWithReasonAndParamsBySig` calls — providing reasoning alongside votes demonstrates deliberative governance participation.

### Temporal Score (20%)

Time-weighted consistency. The hardest signal to fake.

| Signal | Points | Cap |
|--------|--------|-----|
| Wallet age | 100 per year | 400 |
| Bear market activity | 10 per bear-market tx | 300 |
| Consistency (active months / wallet age) | ratio x 300 | 300 |
| Activity entropy (distinct tx hours / 24) | (hours/24) x 200 | 200 |
| Cross-cycle persistence | 150 per bear market period | 300 |

Three bear market windows are tracked: Nov 2018 - Mar 2019, May 2021 - Nov 2021, and Nov 2022 - Jan 2023. Transactions during these periods are counted separately because activity during market downturns is a strong signal of genuine engagement. Cross-cycle persistence rewards wallets active in multiple distinct bear market periods — being present across 2+ cycles is extremely hard to fake.

### Protocol Diversity Score (15%)

Measures breadth of protocol engagement across protocols, chains, and domains.

| Signal | Points | Cap |
|--------|--------|-----|
| Unique protocols used | 35 per protocol | 350 |
| Chains active on | 50 per chain | 250 |
| Protocol category coverage | 80 per category | 400 |
| Early protocol adoption | 60 per early-adopted protocol | 300 |

Six protocol categories are tracked: DeFi, Social, Governance, Infrastructure, Gaming, and Builder Tools. Covering more domains shows broader expertise than depth in a single category. Early protocol adoption awards points for using a protocol within 6 months of its launch — each of the 16 tracked protocols has a `launchTimestamp` and interactions before `launch + 6 months` are counted.

### Complexity Score (10%)

Measures sophistication of individual interactions.

| Signal | Points | Cap |
|--------|--------|-----|
| Transaction volume | 3 per tx | 300 |
| Failed transaction ratio | ratio x 2000 | 300 |
| Average calldata size | sqrt(avg bytes) x 20 | 400 |
| EIP-712 permit interactions | 20 per permit call | 200 |
| Flashloan transactions | 100 per flashloan | 300 |
| Smart wallet interactions | 30 per EntryPoint call | 150 |
| Internal transaction count | sqrt(count) x 15 | 200 |

Failed transactions contribute positively — the PRD notes "failures = pushing limits." EIP-712 permit detection covers ERC-2612 `permit()` and Permit2 calls — advanced token approval patterns. Flashloan detection identifies Aave V2/V3, Balancer, Uniswap V3, and dYdX flashloan calls — representing DeFi composability expertise. Smart wallet interactions count calls to ERC-4337 EntryPoint v0.6 and v0.7 contracts. Internal transaction count uses Etherscan's `txlistinternal` API to measure contract-to-contract call depth — a direct proxy for interaction sophistication.

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

The indexer recognizes **20 protocols** across all 6 chains and maps contract interactions to named protocols:

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
| Treasure | Gaming | Arbitrum only |
| Aavegotchi | Gaming | Polygon only |
| Deterministic Deployment Proxy | Builder Tools | All 6 |
| CREATE2 Factory | Builder Tools | All 6 |

When a wallet interacts with any known contract address, it gets credited for that protocol. The protocol's category (DeFi, Social, etc.) is also tracked for the cross-domain coverage signal in the protocol diversity score.

---

## Governance Tracking

The indexer detects **22 governance contracts** across Ethereum, Arbitrum, Optimism, and Polygon. It classifies 11 governance function signatures into five subtypes:

- **Voting:** `castVote`, `castVoteWithReason`, `castVoteWithReasonAndParams`, `castVoteBySig`, `castVoteWithReasonAndParamsBySig`
- **Proposals:** `propose` (Governor and GovernorBravo variants)
- **Delegation:** `delegate`, `delegateBySig`
- **Queue:** `queue` (treasury queuing)
- **Execute:** `execute` (treasury execution)

Each subtype is scored differently — proposals and delegation events are tracked as separate signals from votes.

Tracked DAOs include ENS, Uniswap, Aave, Compound, MakerDAO, Arbitrum DAO, Optimism Collective, Lido, Curve, Gitcoin, Safe, and others.

---

## Sybil Detection

Every wallet is analyzed for bot-like behavior using eight heuristics. Each heuristic that fires reduces the wallet's confidence multiplier:

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

### MEV Bot Activity (penalty: -15%)
Detects wallets primarily interacting with known MEV bot/searcher contracts. If a wallet has more than 20 MEV interactions AND those interactions comprise more than 30% of total transactions, it gets flagged. Both conditions are required (conservative) — MEV bot behavior inflates transaction counts artificially through automated arbitrage, sandwich attacks, and liquidations. Six known MEV contract addresses are tracked.

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
| Governor | Participated in 5+ DAOs and authored 1+ proposal | Active |
| Explorer | Used 20+ unique protocols | Active |
| OG | First transaction before 2020 | Active |
| Multichain | Active on 4+ chains | Active |
| Trusted | Safe multi-sig signer (2+ executions), 3+ DAOs, 3+ delegations | Active |
| Power User | Protocol diversity raw >= 700 and complexity raw >= 500 | Active |

Badges are evaluated dynamically based on the wallet's indexed activity and score breakdown.

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
| GET | `/v1/timeline/:address` | Activity milestone timeline |
| GET | `/v1/card/:address.png` | SVG score card image |
| POST | `/v1/frame` | Farcaster Frame action callback |
| GET | `/v1/admin/bear-periods` | List bear market periods (hardcoded + dynamic) |
| POST | `/v1/admin/bear-periods` | Add dynamic bear market period (requires X-Admin-Key) |
| DELETE | `/v1/admin/bear-periods/:label` | Remove dynamic bear market period |
| POST | `/v1/webhooks` | Register a webhook for score updates |
| GET | `/v1/webhooks` | List registered webhooks |
| DELETE | `/v1/webhooks/:id` | Unregister a webhook |
| POST | `/v1/appeals` | Submit a sybil appeal |
| GET | `/v1/appeals/:address` | Check appeal status |
| WS | `/v1/stream/:address` | Real-time score updates via WebSocket |

### Rate limiting

100 requests per 60 seconds per IP address. Returns `429 Too Many Requests` when exceeded.

### Caching

All GET routes are cached in Redis with TTLs appropriate to how often the data changes:

- Score, badges, sybil, timeline, card: 5 minutes
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
- **Score page** — SVG radar chart showing all 5 category scores as a filled polygon, with per-category color-coded dots, axis labels, and concentric grid rings. Includes badge display, sybil confidence indicator, and activity timeline with milestone events. OpenGraph and Farcaster Frame meta tags for social sharing with score card images. Shows error states with retry buttons and loading skeletons while data loads.
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

## Verification Widget

A standalone Web Component for embedding ChainCred verification into any page. Uses Shadow DOM — no framework dependencies.

```html
<script src="https://your-cdn.com/chaincred-verify.js"></script>
<chaincred-verify
  wallet="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
  min-score="500"
  required-badges="builder,governor"
  api-url="https://api.chaincred.xyz/v1"
/>
```

### Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `wallet` | Ethereum address to verify | (required) |
| `min-score` | Minimum score threshold for PASS | `0` |
| `required-badges` | Comma-separated badge types that must be earned | (none) |
| `api-url` | ChainCred API base URL | `http://localhost:3001/v1` |

The widget fetches score and badge data from the API, then renders a pass/fail card with the score, sybil confidence level, and earned badge chips. Build standalone with `bun run --filter @chaincred/frontend build:widget`.

A live demo is available at `http://localhost:5173/widget` when the dev server is running.

---

## Score Card & Farcaster Frame

The API generates enhanced SVG score cards at `/v1/card/:address.png` for social sharing. Each card displays the wallet's total score with color coding (green >= 700, yellow >= 400, red < 400), five category breakdown bars (builder/governance/temporal/diversity/complexity), a badge row with colored circles for all 7 badges (earned badges filled, unearned grayed out), ENS name (if available), truncated address, and a progress bar.

The score page includes OpenGraph and Farcaster Frame meta tags:

- `og:image` and `twitter:image` point to the card image
- `fc:frame` tags enable Farcaster Frame embedding with a "View Score" link button
- `fc:frame:input:text` enables address input for looking up other wallets
- `fc:frame:button:2` (Look Up) posts to `/v1/frame` which returns a new frame with the looked-up wallet's score card
- `POST /v1/frame` handles the callback — validates the address, returns a score card frame or an error frame with retry
- Meta tags render server-side for social crawlers

---

## Exclusion Registry

When the `CHAINCRED_REGISTRY_ADDRESS` environment variable is set, the score service checks the onchain ChainCredRegistry contract before computing scores. If `excludedAddresses(address)` returns true, the API returns a score of 0 with all categories zeroed.

The check is fail-open — if the RPC is unreachable, scoring proceeds normally. This prevents protocol-owned wallets and known bots from receiving inflated scores.

---

## Activity Timeline

The timeline endpoint (`/v1/timeline/:address`) derives milestone events from the existing `events` table without requiring additional storage:

- **first_tx** — First ever transaction with chain
- **first_deployment** — First contract deployment
- **first_governance** — First governance interaction
- **chain_added** — Each new chain the wallet became active on
- **badge_earned** — When a badge was first earned (builder: 3rd deployment, governor: 5th governance event, og: first tx before 2020, multichain: 4th chain, explorer: 20th unique protocol)

Events are returned sorted chronologically. The frontend renders them as a vertical timeline below the score cards, with badge milestone events showing the badge type (e.g., "Badge Earned — Builder").

---

## Advanced Interaction Detection

The indexer detects advanced interaction patterns via function selectors:

### EIP-712 Permits
Detects `permit()` (ERC-2612), Permit2 `permitTransferFrom`, and Permit2 batch calls. These represent sophisticated token approval workflows beyond standard `approve()`.

### Flashloans
Detects flashloan calls to Aave V2/V3, Balancer, Uniswap V3 `flash()`, and dYdX `operate()`. Flashloan usage indicates advanced DeFi composability expertise.

### ERC-4337 Account Abstraction
Detects `handleOps` and `handleAggregatedOps` calls to EntryPoint v0.6 and v0.7 contracts. Also detects interactions *to* EntryPoint addresses (smart wallet users).

All selectors are centralized in `packages/common/src/constants/selectors.ts` for consistency across packages.

---

## Sybil Explanation Detail

The sybil indicator component in the frontend now shows detailed explanations for each detected flag, not just the flag name and penalty percentage. Below the confidence percentage, a brief explanation tells users what the confidence score means. When no flags are detected (confidence > 95%), a "No concerning patterns detected" message is shown.

---

## Dynamic Bear Market Periods

Bear market periods can be managed at runtime via the admin API. Three periods are hardcoded (Nov 2018, May 2021, Nov 2022) and cannot be removed. Dynamic periods can be added and removed by authorized admins.

The `X-Admin-Key` header must match the `ADMIN_API_KEY` environment variable for write operations. Read operations (listing periods) are public.

---

## Webhooks

Webhook support for score update notifications. Webhooks are persisted in PostgreSQL so they survive API restarts.

- **Register:** `POST /v1/webhooks` with `{ address, url, secret? }`
- **Delivery:** When scores are pushed via WebSocket (every 60s for subscribed addresses), registered webhooks also receive the update
- **Signature:** If a `secret` is provided, the payload is signed with HMAC-SHA-256 and the signature is included in the `X-ChainCred-Signature` header
- **Payload:** `{ event: "score.updated", address, score, timestamp }`

---

## Infrastructure

### Database

PostgreSQL stores indexed wallet activity and Merkle proofs. The schema tracks:

- `wallet_activity` — per-wallet aggregated data: address, first tx timestamp, total transactions, contracts deployed, deployment chains, deployment calldata bytes, unique protocols, chains active, governance votes, DAOs participated, proposals created, delegation events, bear market transactions, active months, protocol categories, failed transactions, total calldata bytes, recipient addresses, chain:protocol pairs, gas price set, tx hour set, CREATE2 deployments, bear market periods, execution events, governance chains, permit interactions, flashloan transactions, smart wallet interactions, ERC-4337 operations, early adoptions, independent votes, earliest deployment timestamp, safe executions, verified deployments, reasoned votes, MEV interactions, internal transactions
- `merkle_proofs` — per-wallet Merkle proofs (address, score, proof array, root hash, creation timestamp)
- `webhooks` — persistent webhook subscriptions (id, address, url, secret, created_at)
- `appeals` — sybil appeal queue (id, address, reason, status, created_at)
- `wallet_scores` — pre-computed scores for leaderboard optimization (address, total_score, computed_at)

Migrations run automatically via `bun run migrate`.

### Docker

**Development:** `docker compose up` starts PostgreSQL, Redis, runs migrations, and launches the API (with hot reload) and indexer using bind-mounted source code.

**Production:** `docker compose --profile prod up` builds optimized images using a multi-stage Dockerfile (`oven/bun:1-alpine` base). No bind mounts — source is copied into the image.

**Merkle generation:** `docker compose run --profile tools merkle-gen` runs the weekly tree generation.

### CI/CD

**GitHub Actions** runs three workflows:

- **CI** (on push/PR) — Typechecks all 5 TypeScript packages, runs 103 tests (67 scoring + 36 API), builds and tests Solidity contracts, checks Solidity formatting
- **Weekly Merkle** (Monday 06:00 UTC, or manual) — Generates the Merkle tree against a PostgreSQL service and outputs the root for onchain submission
- **Deploy Contracts** (manual trigger) — Deploys all 3 contracts to Sepolia or mainnet via Foundry with Etherscan verification. Supports dry-run mode.

### Testing

103 automated tests cover:

- **Scoring engine** (67 tests) — Category calculators with multi-signal formulas, badge evaluation (governor proposal requirement, trusted Safe multi-sig + governance depth, power-user criteria), sybil detection with all 8 heuristics (temporal clustering, action repetition, zero failure rate, funding graph, cross-chain mirroring, CEX freshness, gas patterns, MEV bot activity), combined penalty math, enriched signal contribution tests (activity entropy, CREATE2), builder multi-signal tests (deployment longevity, verified source), governance signals (execution, cross-chain, independent voting, Safe executions, reasoned votes), temporal signals (cross-cycle persistence), complexity signals (permits, flashloans, smart wallets, internal transactions), protocol diversity signals (early adoption)
- **API** (36 tests) — Health check, address validation, CORS, rate limiting, all route responses, timeline endpoint (validation, fields, badge milestones, DB-dependent), card image (SVG content, validation), Farcaster Frame (valid/invalid address), admin bear-period endpoints (list, auth), webhook CRUD (register, list, validation), appeal validation (invalid address, missing fields), WebSocket streaming (connect, invalid address, ping/pong, subscription cleanup). Tests work with or without PostgreSQL/Redis running.

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
| `CHAINCRED_REGISTRY_ADDRESS` | ChainCredRegistry contract for exclusion checks | — |
| `RPC_URL` | Ethereum RPC endpoint for onchain reads | — |
| `ADMIN_API_KEY` | Admin API key for bear market period management | — |
| `API_BASE_URL` | API base URL for Farcaster Frame callbacks | `http://localhost:3001/v1` |
| `FRONTEND_URL` | Frontend URL for Frame "View Details" links | `http://localhost:5173` |
| `ETHERSCAN_API_KEY` | Etherscan V2 API key for verified source + internal tx enrichment | — |

---

## ENS Name Resolution

When an Ethereum RPC endpoint is configured via `RPC_URL`, the score service resolves ENS names for wallet addresses via `getEnsName()`. Names are cached in-memory for 1 hour.

ENS names appear in:
- The score API response (`ensName` field in WalletScore)
- The SVG score card (above the truncated address)
- The frontend score page (displayed above the address code block)

The resolution is fail-open — if `RPC_URL` is not set or the RPC is unreachable, the score is returned without an ENS name.

---

## Sybil Appeal System

Wallets flagged by sybil detection can submit appeals for manual review:

- **Submit:** `POST /v1/appeals` with `{ address, reason }` — creates a pending appeal
- **Check:** `GET /v1/appeals/:address` — returns the latest appeal status (pending/approved/rejected)
- **Score protection:** While an appeal is pending, the sybil multiplier is floored at 0.5 — the score is frozen but not zeroed

Appeals are stored in PostgreSQL with status tracking. The appeal system is designed for integration with external review workflows (e.g., GitHub issues + signed messages).

---

## Leaderboard Optimization

The leaderboard endpoint supports two paths:

1. **Optimized path:** When the `wallet_scores` table has pre-computed scores (populated during Merkle tree generation), the leaderboard uses SQL-level `ORDER BY total_score DESC` with `LIMIT/OFFSET` — O(1) per request.
2. **Fallback path:** Without pre-computed scores, falls back to loading all wallet activity rows, scoring each in JavaScript, and sorting in memory — O(N) per request.

The Merkle tree generation script now upserts scores into `wallet_scores` automatically, so the optimized path is used after the first weekly Merkle run.

---

## Safe Multi-Sig Detection

The indexer detects Safe `execTransaction` calls (selector `0x6a761202`) as a governance signal. Wallets that execute Safe multi-sig transactions are recognized as collaborative governance participants:

- **Scoring:** 50 points per Safe execution, capped at 200 (governance category)
- **Badge:** The Trusted badge now requires `safeExecutions >= 2` along with participation in 3+ DAOs and 3+ delegation events — replacing the previous proposal-based proxy with real multi-sig signer tracking

---

## Verified Source Detection

When `ETHERSCAN_API_KEY` is set, the score service enriches wallet data with verified contract source code detection via the Etherscan V2 API. Wallets that have deployed contracts with verified source code on Etherscan receive additional builder score points (80 per verified contract, capped at 240).

The Etherscan client includes a 240ms throttle to respect rate limits and a 24-hour in-memory cache. Supported chains: Ethereum (1), Arbitrum (42161), Optimism (10), Base (8453), Polygon (137). zkSync (324) is not supported by Etherscan V2.

Enrichment is fail-open — if the API key is not set or any error occurs, scoring proceeds without the enrichment.

---

## Reasoned Votes Detection

The indexer detects governance votes cast with reasoning via three function selectors:

- `castVoteWithReason(uint256,uint8,string)` — `0x7b3c71d3`
- `castVoteWithReasonAndParams(uint256,uint8,string,bytes)` — `0x5f398a14`
- `castVoteWithReasonAndParamsBySig(...)` — `0x15373e3d`

Providing reasoning alongside governance votes is a strong signal of deliberative participation — it requires more effort than simple voting and demonstrates thought leadership. Scored at 50 points per reasoned vote, capped at 150 (governance category).

---

## MEV Detection

The sybil detection system identifies wallets that primarily interact with known MEV bot/searcher contracts. Six known MEV addresses are tracked (high-frequency bots, Flashbots MEV-Share router, sandwich bots, liquidation bots, and searcher contracts).

The heuristic requires both conditions to fire (conservative):
1. More than 20 MEV interactions
2. MEV interactions comprise more than 30% of total transactions

When triggered, applies a 0.15 (15%) penalty to the sybil confidence multiplier.

---

## Internal Transaction Depth

When `ETHERSCAN_API_KEY` is set, the score service fetches internal transaction counts from Etherscan's `txlistinternal` API. Internal transactions represent contract-to-contract calls — a direct measure of interaction sophistication.

Scored as `sqrt(count) × 15`, capped at 200 (complexity category). The square root scaling rewards depth of interaction while preventing runaway scores from extremely active wallets.
