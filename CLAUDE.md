# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChainCred is an onchain expertise reputation layer for Ethereum/EVM networks. It indexes wallet activity across 6 chains (Ethereum, Arbitrum, Optimism, Base, zkSync, Polygon), computes sybil-resistant expertise scores (0–1000), and emits them as EAS attestations. See PRD.md for full product requirements.

## Commands

```bash
# Install dependencies
bun install

# Type checking (all packages)
bun run typecheck

# Tests (all packages, uses bun:test)
bun run test

# Run a single test file
bun test packages/scoring/test/engine.test.ts

# Dev servers
bun run dev:api          # API with hot reload (Hono on Bun)
bun run dev:frontend     # SvelteKit dev server

# Database
bun run migrate          # Run schema migration
bun run seed             # Seed 15 test wallet profiles

# E2E testing (requires Docker + Foundry)
bun run e2e              # Full E2E suite: infra, seed, deploy, assertions

# Contracts (Foundry)
cd packages/contracts && forge build
cd packages/contracts && forge test
cd packages/contracts && forge fmt

# Anvil deployment (local fork)
bash packages/contracts/script/deploy-anvil.sh
```

## Architecture

Bun monorepo with 6 workspace packages under `packages/`:

```
common → shared types, constants, utilities (all other packages depend on this)
scoring → core scoring engine with 5 category calculators + sybil detection
api → Hono REST API with PostgreSQL + Redis
indexer → HyperSync-based multi-chain blockchain indexer
contracts → Solidity (Foundry) — ChainCredRegistry, BadgeResolver, ScoreMerkleRoot
frontend → SvelteKit + Tailwind CSS explorer UI
```

**Dependency flow:** `indexer → DB ← api → scoring → common` / `frontend → common`

### Scoring Engine

Five category calculators in `packages/scoring/src/categories/`, each producing a raw score (0–1000) that gets weighted:
- **builder** (30%) — contract deployments, verified source, factory/proxy patterns
- **governance** (25%) — DAO votes, proposals, multi-sig, delegation
- **temporal** (20%) — wallet age, bear market activity, consistency
- **protocolDiversity** (15%) — unique protocols, domain coverage, L2 fluency
- **complexity** (10%) — calldata size, internal call depth, flashloans

Sybil detection (`packages/scoring/src/sybil/`) produces a confidence multiplier (0.0–1.0) applied to the raw score. Weights and score constants live in `packages/common/src/constants/weights.ts`.

### API Routes

All routes prefixed `/v1/` in `packages/api/src/routes/`: score, badges, sybil, attestation, verify, leaderboard, stats, proof, timeline, card, frame, admin, webhooks, appeals, ws. Rate limited at 100 req/60s per IP.

### Contracts

Solidity 0.8.24 with Foundry. Three contracts:
- **ChainCredRegistry** — schema UIDs, admin roles, excluded addresses (Ownable, Pausable)
- **BadgeResolver** — EAS SchemaResolver validating 7 badge types
- **ScoreMerkleRoot** — weekly Merkle root for trustless score verification

## Code Conventions

- **Package manager:** Bun (bun.lock)
- **TypeScript:** strict mode, ES2022 target, bundler module resolution
- **Prettier:** 100 char width, 2-space indent, single quotes, trailing commas, semicolons
- **Solidity formatting:** 120 char width, 4-space indent, no bracket spacing (forge fmt)
- Workspace packages reference each other with `workspace:*`
- All packages use `"type": "module"` with ESM imports
- PRD section references appear in comments (e.g., `/** PRD 4.1 — Category weights */`)
