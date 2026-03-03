# Multi-stage Dockerfile for ChainCred services (api, indexer, migrate)
# Usage:
#   docker build --target api -t chaincred-api .
#   docker build --target indexer -t chaincred-indexer .
#   docker build --target migrate -t chaincred-migrate .

# ── Stage 1: Install dependencies ──
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy workspace config and all package.json files for dependency resolution
COPY package.json bun.lock ./
COPY packages/common/package.json packages/common/package.json
COPY packages/scoring/package.json packages/scoring/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/indexer/package.json packages/indexer/package.json

RUN bun install --frozen-lockfile --production

# ── Stage 2: Copy source ──
FROM oven/bun:1-alpine AS source

WORKDIR /app

COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/packages/common/node_modules packages/common/node_modules
COPY --from=deps /app/packages/scoring/node_modules packages/scoring/node_modules
COPY --from=deps /app/packages/api/node_modules packages/api/node_modules
COPY --from=deps /app/packages/indexer/node_modules packages/indexer/node_modules

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/common packages/common
COPY packages/scoring packages/scoring
COPY packages/api packages/api
COPY packages/indexer packages/indexer

# ── API target ──
FROM source AS api

ENV NODE_ENV=production
EXPOSE 3001

CMD ["bun", "run", "packages/api/src/app.ts"]

# ── Indexer target ──
FROM source AS indexer

ENV NODE_ENV=production

CMD ["bun", "run", "packages/indexer/src/index.ts"]

# ── Migrate target ──
FROM source AS migrate

CMD ["bun", "run", "packages/common/src/db-migrate.ts"]
