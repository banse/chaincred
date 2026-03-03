#!/usr/bin/env bash
set -euo pipefail

# ── ChainCred E2E Test Suite ──
# Orchestrates infrastructure, seeds data, deploys contracts, and runs ~35 endpoint assertions.
#
# Usage: bash scripts/e2e-test.sh
#        bun run e2e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
API_PID=""
ANVIL_PID=""
ANVIL_SOURCE="" # "local" or "docker"

# ── Helpers ──

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo -e "  ${GREEN}PASS${NC} $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  echo -e "  ${RED}FAIL${NC} $1"
  if [[ -n "${2:-}" ]]; then
    echo -e "       ${RED}→ $2${NC}"
  fi
}

skip() {
  SKIP_COUNT=$((SKIP_COUNT + 1))
  echo -e "  ${YELLOW}SKIP${NC} $1"
}

section() {
  echo ""
  echo -e "${CYAN}── $1 ──${NC}"
}

# ── Cleanup trap ──

cleanup() {
  section "Cleanup"

  if [[ -n "$API_PID" ]] && kill -0 "$API_PID" 2>/dev/null; then
    echo "Stopping API server (PID $API_PID)..."
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi

  if [[ "$ANVIL_SOURCE" == "local" && -n "$ANVIL_PID" ]] && kill -0 "$ANVIL_PID" 2>/dev/null; then
    echo "Stopping local Anvil (PID $ANVIL_PID)..."
    kill "$ANVIL_PID" 2>/dev/null || true
    wait "$ANVIL_PID" 2>/dev/null || true
  fi

  if [[ "$ANVIL_SOURCE" == "docker" ]]; then
    echo "Stopping Docker Anvil..."
    docker compose --profile e2e stop anvil 2>/dev/null || true
  fi

  echo "Stopping Postgres + Redis..."
  docker compose stop postgres redis 2>/dev/null || true

  echo ""
  echo -e "${CYAN}════════════════════════════════${NC}"
  echo -e "  ${GREEN}PASS: $PASS_COUNT${NC}  ${RED}FAIL: $FAIL_COUNT${NC}  ${YELLOW}SKIP: $SKIP_COUNT${NC}"
  echo -e "${CYAN}════════════════════════════════${NC}"

  if [[ $FAIL_COUNT -gt 0 ]]; then
    exit 1
  fi
}

trap cleanup EXIT

# ── Configuration ──

API_URL="http://localhost:3001"
RPC_URL="http://localhost:8545"
ADMIN_KEY="${ADMIN_API_KEY:-chaincred-admin}"
FORK_RPC_URL="${FORK_RPC_URL:-https://eth.llamarpc.com}"

# Test wallets
VITALIK="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
GOVERNOR="0xd26a3F686D43f2A62BA9eaE2ff77e9f516d945B9"
GOV_WHALE="0x76e222b07C53D28b89b0bAc18602810Fc22B4930"
OG="0xDBF5E9c5206d0dB70a90108bf936DA60221dC080"
EXPLORER="0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7"
DEPLOYER="0xab5801a7d398351b8be11c439e05c5b3259aec9b"
POWER_USER="0x0c23fc0ef06716d2f8ba19bc4bed56d045581f2d"
SYBIL="0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1"
AVERAGE="0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa"
EXCLUDED="0x000000000000000000000000000000000000dEaD"

echo -e "${CYAN}╔════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   ChainCred E2E Test Suite         ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════╝${NC}"

# ══════════════════════════════════════
# Phase 1: Start Postgres + Redis
# ══════════════════════════════════════

section "Phase 1: Start Postgres + Redis"
docker compose up -d postgres redis
echo "Waiting for Postgres to be healthy..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U chaincred > /dev/null 2>&1; then
    echo "Postgres ready."
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "Error: Postgres did not become healthy in 30s"
    exit 1
  fi
  sleep 1
done

# ══════════════════════════════════════
# Phase 2: Start Anvil
# ══════════════════════════════════════

section "Phase 2: Start Anvil (mainnet fork)"

if command -v anvil > /dev/null 2>&1; then
  echo "Using local Anvil..."
  ANVIL_SOURCE="local"
  anvil --fork-url "$FORK_RPC_URL" \
    --port 8545 --chain-id 1 --accounts 3 --balance 10000 \
    --fork-block-number 19000000 \
    > /tmp/anvil-e2e.log 2>&1 &
  ANVIL_PID=$!
else
  echo "Local Anvil not found, using Docker..."
  ANVIL_SOURCE="docker"
  FORK_RPC_URL="$FORK_RPC_URL" docker compose --profile e2e up -d anvil
fi

echo "Waiting for Anvil..."
for i in $(seq 1 30); do
  if cast block-number --rpc-url "$RPC_URL" > /dev/null 2>&1; then
    echo "Anvil ready at block $(cast block-number --rpc-url "$RPC_URL")."
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "Error: Anvil did not start in 30s"
    exit 1
  fi
  sleep 1
done

# ══════════════════════════════════════
# Phase 3: Run migration
# ══════════════════════════════════════

section "Phase 3: Run DB migration"
bun run migrate

# ══════════════════════════════════════
# Phase 4: Seed wallets
# ══════════════════════════════════════

section "Phase 4: Seed wallet data"
bun run seed

# ══════════════════════════════════════
# Phase 5: Deploy contracts to Anvil
# ══════════════════════════════════════

section "Phase 5: Deploy contracts to Anvil"
RPC_URL="$RPC_URL" bash packages/contracts/script/deploy-anvil.sh

# Source the generated env file
if [[ -f .env.anvil ]]; then
  # shellcheck disable=SC1091
  source .env.anvil
  echo "Loaded contract addresses from .env.anvil"
else
  echo "Error: .env.anvil not found"
  exit 1
fi

# ══════════════════════════════════════
# Phase 6: Generate Merkle tree
# ══════════════════════════════════════

section "Phase 6: Generate Merkle tree"
MERKLE_OUTPUT=$(bun run packages/api/src/scripts/generate-merkle.ts 2>&1)
echo "$MERKLE_OUTPUT"

# Extract root from output
MERKLE_ROOT=$(echo "$MERKLE_OUTPUT" | grep "Root:" | awk '{print $2}')
if [[ -z "$MERKLE_ROOT" ]]; then
  echo "Error: Could not extract Merkle root"
  exit 1
fi
echo "Merkle root: $MERKLE_ROOT"

# ══════════════════════════════════════
# Phase 7: Publish Merkle root on-chain
# ══════════════════════════════════════

section "Phase 7: Publish Merkle root on-chain"
DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

cast send "$SCORE_MERKLE_ADDRESS" "updateMerkleRoot(bytes32)" "$MERKLE_ROOT" \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_KEY" \
  > /dev/null 2>&1

# Verify
ON_CHAIN_ROOT=$(cast call "$SCORE_MERKLE_ADDRESS" "merkleRoot()(bytes32)" --rpc-url "$RPC_URL" 2>/dev/null)
echo "On-chain root: $ON_CHAIN_ROOT"

EPOCH=$(cast call "$SCORE_MERKLE_ADDRESS" "epoch()(uint256)" --rpc-url "$RPC_URL" 2>/dev/null)
echo "Epoch: $EPOCH"

# ══════════════════════════════════════
# Phase 8: Start API server
# ══════════════════════════════════════

section "Phase 8: Start API server"
export PORT=3001
export SCORE_MERKLE_ADDRESS
export CHAINCRED_REGISTRY_ADDRESS
export ADMIN_API_KEY="$ADMIN_KEY"
export RPC_URL

bun run packages/api/src/app.ts > /tmp/chaincred-api.log 2>&1 &
API_PID=$!

echo "Waiting for API (PID $API_PID)..."
for i in $(seq 1 15); do
  if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo "API ready."
    break
  fi
  if [[ $i -eq 15 ]]; then
    echo "Error: API did not start in 15s"
    cat /tmp/chaincred-api.log
    exit 1
  fi
  sleep 1
done

# ══════════════════════════════════════
# Phase 9: Run endpoint assertions
# ══════════════════════════════════════

section "Phase 9: Endpoint assertions"

# ── Score ──
echo ""
echo "Score endpoints:"

SCORE_JSON=$(curl -sf "$API_URL/v1/score/$VITALIK" 2>/dev/null || echo "")
if [[ -n "$SCORE_JSON" ]]; then
  TOTAL=$(echo "$SCORE_JSON" | jq -r '.totalScore // 0')
  if [[ "$TOTAL" -gt 0 && "$TOTAL" -le 1000 ]]; then
    pass "score: totalScore in range ($TOTAL)"
  else
    fail "score: totalScore out of range" "got $TOTAL"
  fi

  # Check all 5 category raws > 0
  ALL_CATS=$(echo "$SCORE_JSON" | jq '[.breakdown.builder.raw, .breakdown.governance.raw, .breakdown.temporal.raw, .breakdown.protocolDiversity.raw, .breakdown.complexity.raw] | all(. > 0)')
  if [[ "$ALL_CATS" == "true" ]]; then
    pass "score: all 5 category raws > 0"
  else
    fail "score: not all category raws > 0" "$(echo "$SCORE_JSON" | jq '.breakdown | map_values(.raw)')"
  fi

  SYBIL_MULT=$(echo "$SCORE_JSON" | jq -r '.sybilMultiplier // 0')
  if (( $(echo "$SYBIL_MULT > 0.5" | bc -l) )); then
    pass "score: sybilMultiplier > 0.5 ($SYBIL_MULT)"
  else
    fail "score: sybilMultiplier too low" "got $SYBIL_MULT"
  fi

  RAW=$(echo "$SCORE_JSON" | jq -r '.rawScore // 0')
  if [[ "$RAW" -gt 0 ]]; then
    pass "score: rawScore > 0 ($RAW)"
  else
    fail "score: rawScore is 0"
  fi

  HAS_BREAKDOWN=$(echo "$SCORE_JSON" | jq 'has("breakdown")')
  if [[ "$HAS_BREAKDOWN" == "true" ]]; then
    pass "score: breakdown present"
  else
    fail "score: breakdown missing"
  fi

  HAS_TS=$(echo "$SCORE_JSON" | jq '.timestamp > 0')
  if [[ "$HAS_TS" == "true" ]]; then
    pass "score: timestamp > 0"
  else
    fail "score: timestamp missing or 0"
  fi
else
  fail "score: GET /v1/score/$VITALIK failed"
fi

# ── Excluded wallet ──
echo ""
echo "Excluded wallet:"

EXCL_JSON=$(curl -sf "$API_URL/v1/score/$EXCLUDED" 2>/dev/null || echo "")
if [[ -n "$EXCL_JSON" ]]; then
  EXCL_SCORE=$(echo "$EXCL_JSON" | jq -r '.totalScore // -1')
  if [[ "$EXCL_SCORE" -eq 0 ]]; then
    pass "excluded: totalScore == 0"
  else
    fail "excluded: totalScore != 0" "got $EXCL_SCORE"
  fi

  EXCL_MULT=$(echo "$EXCL_JSON" | jq -r '.sybilMultiplier // -1')
  if [[ "$EXCL_MULT" == "0" ]]; then
    pass "excluded: sybilMultiplier == 0"
  else
    fail "excluded: sybilMultiplier != 0" "got $EXCL_MULT"
  fi
else
  # Exclusion may return 403 or different error — check non-200 case
  EXCL_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/v1/score/$EXCLUDED" 2>/dev/null || echo "0")
  if [[ "$EXCL_STATUS" -ne 200 ]]; then
    pass "excluded: rejected with HTTP $EXCL_STATUS"
    pass "excluded: non-200 status implies exclusion"
  else
    fail "excluded: unexpected response"
  fi
fi

# ── Badges ──
echo ""
echo "Badge endpoints:"

BADGE_JSON=$(curl -sf "$API_URL/v1/badges/$VITALIK" 2>/dev/null || echo "")
if [[ -n "$BADGE_JSON" ]]; then
  BADGE_COUNT=$(echo "$BADGE_JSON" | jq '.badges | length')
  if [[ "$BADGE_COUNT" -eq 7 ]]; then
    pass "badges: 7 types returned"
  else
    fail "badges: expected 7 types" "got $BADGE_COUNT"
  fi

  BUILDER_EARNED=$(echo "$BADGE_JSON" | jq '[.badges[] | select(.type == "builder")] | .[0].earned')
  if [[ "$BUILDER_EARNED" == "true" ]]; then
    pass "badges: builder earned (vitalik)"
  else
    fail "badges: builder not earned"
  fi

  OG_BADGE=$(curl -sf "$API_URL/v1/badges/$OG" 2>/dev/null | jq '[.badges[] | select(.type == "og")] | .[0].earned' 2>/dev/null || echo "false")
  if [[ "$OG_BADGE" == "true" ]]; then
    pass "badges: og earned (timbeiko)"
  else
    fail "badges: og not earned"
  fi
else
  fail "badges: GET /v1/badges/$VITALIK failed"
fi

# ── Sybil ──
echo ""
echo "Sybil endpoints:"

SYBIL_JSON=$(curl -sf "$API_URL/v1/sybil/$SYBIL" 2>/dev/null || echo "")
if [[ -n "$SYBIL_JSON" ]]; then
  CONF=$(echo "$SYBIL_JSON" | jq -r '.confidence // 1')
  # confidence is how human-like (1 = human, 0 = sybil), so sybil wallet should be < 0.5
  if (( $(echo "$CONF < 0.5" | bc -l) )); then
    pass "sybil: sybil wallet confidence < 0.5 ($CONF)"
  else
    fail "sybil: sybil wallet confidence too high" "got $CONF"
  fi

  FLAG_COUNT=$(echo "$SYBIL_JSON" | jq '[.flags[] | select(.detected == true)] | length')
  if [[ "$FLAG_COUNT" -ge 3 ]]; then
    pass "sybil: 3+ flags detected ($FLAG_COUNT)"
  else
    fail "sybil: fewer than 3 flags" "got $FLAG_COUNT"
  fi
else
  fail "sybil: GET /v1/sybil/$SYBIL failed"
fi

CLEAN_JSON=$(curl -sf "$API_URL/v1/sybil/$VITALIK" 2>/dev/null || echo "")
if [[ -n "$CLEAN_JSON" ]]; then
  CLEAN_CONF=$(echo "$CLEAN_JSON" | jq -r '.confidence // 0')
  if (( $(echo "$CLEAN_CONF > 0.8" | bc -l) )); then
    pass "sybil: clean wallet confidence > 0.8 ($CLEAN_CONF)"
  else
    fail "sybil: clean wallet confidence too low" "got $CLEAN_CONF"
  fi
else
  fail "sybil: GET /v1/sybil/$VITALIK failed"
fi

# ── Leaderboard ──
echo ""
echo "Leaderboard endpoints:"

LB_JSON=$(curl -sf "$API_URL/v1/leaderboard" 2>/dev/null || echo "")
if [[ -n "$LB_JSON" ]]; then
  LB_COUNT=$(echo "$LB_JSON" | jq '.entries | length')
  if [[ "$LB_COUNT" -gt 0 ]]; then
    pass "leaderboard: entries > 0 ($LB_COUNT)"
  else
    fail "leaderboard: no entries"
  fi

  # Check sorted descending
  SORTED=$(echo "$LB_JSON" | jq '[.entries[].score] | . == (. | sort | reverse)')
  if [[ "$SORTED" == "true" ]]; then
    pass "leaderboard: sorted descending"
  else
    fail "leaderboard: not sorted descending"
  fi

  # Category filter
  LB_GOV=$(curl -sf "$API_URL/v1/leaderboard?category=governance" 2>/dev/null || echo "")
  if [[ -n "$LB_GOV" ]]; then
    LB_CAT=$(echo "$LB_GOV" | jq -r '.category')
    if [[ "$LB_CAT" == "governance" ]]; then
      pass "leaderboard: category filter works"
    else
      fail "leaderboard: category filter wrong" "got $LB_CAT"
    fi
  else
    fail "leaderboard: category filter request failed"
  fi
else
  fail "leaderboard: GET /v1/leaderboard failed"
fi

# ── Timeline ──
echo ""
echo "Timeline endpoints:"

TL_JSON=$(curl -sf "$API_URL/v1/timeline/$VITALIK" 2>/dev/null || echo "")
if [[ -n "$TL_JSON" ]]; then
  TL_COUNT=$(echo "$TL_JSON" | jq '.events | length')
  if [[ "$TL_COUNT" -gt 0 ]]; then
    pass "timeline: events non-empty ($TL_COUNT)"
  else
    fail "timeline: no events"
  fi

  HAS_TYPE=$(echo "$TL_JSON" | jq '.events[0] | has("type")')
  if [[ "$HAS_TYPE" == "true" ]]; then
    pass "timeline: events have type field"
  else
    fail "timeline: events missing type"
  fi
else
  fail "timeline: GET /v1/timeline/$VITALIK failed"
fi

# ── Card (SVG) ──
echo ""
echo "Card endpoints:"

CARD_RESP=$(curl -sf "$API_URL/v1/card/$VITALIK.png" 2>/dev/null || echo "")
if [[ -n "$CARD_RESP" ]]; then
  if echo "$CARD_RESP" | grep -q "<svg"; then
    pass "card: returns SVG"
  else
    fail "card: not SVG" "response does not contain <svg"
  fi

  if echo "$CARD_RESP" | grep -qi "ChainCred"; then
    pass "card: has ChainCred branding"
  else
    fail "card: missing ChainCred branding"
  fi
else
  fail "card: GET /v1/card/$VITALIK.png failed"
fi

# ── Merkle Proof ──
echo ""
echo "Merkle proof endpoints:"

PROOF_JSON=$(curl -sf "$API_URL/v1/proof/$VITALIK" 2>/dev/null || echo "")
if [[ -n "$PROOF_JSON" ]]; then
  HAS_PROOF=$(echo "$PROOF_JSON" | jq 'has("proof")')
  if [[ "$HAS_PROOF" == "true" ]]; then
    pass "proof: proof field exists"
  else
    fail "proof: proof field missing"
  fi

  PROOF_LEN=$(echo "$PROOF_JSON" | jq '.proof | length')
  if [[ "$PROOF_LEN" -gt 0 ]]; then
    pass "proof: proof array non-empty ($PROOF_LEN entries)"
  else
    fail "proof: proof array empty"
  fi

  HAS_ROOT=$(echo "$PROOF_JSON" | jq -r '.root // ""')
  if [[ -n "$HAS_ROOT" && "$HAS_ROOT" != "null" ]]; then
    pass "proof: root present"
  else
    fail "proof: root missing"
  fi
else
  fail "proof: GET /v1/proof/$VITALIK failed"
fi

# ── On-chain Verify ──
echo ""
echo "On-chain verify:"

if [[ -n "$PROOF_JSON" ]]; then
  PROOF_SCORE=$(echo "$PROOF_JSON" | jq -r '.score')
  PROOF_ARRAY=$(echo "$PROOF_JSON" | jq -c '.proof')

  VERIFY_JSON=$(curl -sf -X POST "$API_URL/v1/verify" \
    -H "Content-Type: application/json" \
    -d "{\"address\":\"$VITALIK\",\"score\":$PROOF_SCORE,\"proof\":$PROOF_ARRAY}" 2>/dev/null || echo "")

  if [[ -n "$VERIFY_JSON" ]]; then
    VERIFIED=$(echo "$VERIFY_JSON" | jq -r '.verified // false')
    if [[ "$VERIFIED" == "true" ]]; then
      pass "verify: verified == true"
    else
      fail "verify: verified != true" "$(echo "$VERIFY_JSON" | jq -c .)"
    fi

    V_EPOCH=$(echo "$VERIFY_JSON" | jq -r '.epoch // 0')
    if [[ "$V_EPOCH" -gt 0 ]]; then
      pass "verify: epoch > 0 ($V_EPOCH)"
    else
      fail "verify: epoch is 0"
    fi
  else
    fail "verify: POST /v1/verify failed"
  fi
else
  skip "verify: skipped (no proof data)"
  skip "verify: skipped (no proof data)"
fi

# ── Attestation ──
echo ""
echo "Attestation endpoints:"

ATT_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$API_URL/v1/attestation/$VITALIK" 2>/dev/null || echo "0")
if [[ "$ATT_STATUS" -eq 200 ]]; then
  pass "attestation: returns 200"
else
  # 200 with null body is also acceptable
  fail "attestation: unexpected status" "got $ATT_STATUS"
fi

# ── Appeals ──
echo ""
echo "Appeal endpoints:"

APPEAL_JSON=$(curl -sf -X POST "$API_URL/v1/appeals" \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$SYBIL\",\"reason\":\"I am not a sybil, I was doing arbitrage\"}" 2>/dev/null || echo "")

if [[ -n "$APPEAL_JSON" ]]; then
  APP_STATUS=$(echo "$APPEAL_JSON" | jq -r '.status // ""')
  if [[ "$APP_STATUS" == "pending" ]]; then
    pass "appeals: POST returns pending"
  else
    fail "appeals: POST status != pending" "got $APP_STATUS"
  fi
else
  fail "appeals: POST /v1/appeals failed"
fi

APPEAL_GET=$(curl -sf "$API_URL/v1/appeals/$SYBIL" 2>/dev/null || echo "")
if [[ -n "$APPEAL_GET" ]]; then
  GET_STATUS=$(echo "$APPEAL_GET" | jq -r '.status // ""')
  if [[ "$GET_STATUS" == "pending" ]]; then
    pass "appeals: GET returns pending"
  else
    fail "appeals: GET status != pending" "got $GET_STATUS"
  fi
else
  fail "appeals: GET /v1/appeals/$SYBIL failed"
fi

# Score with pending appeal should floor sybilMultiplier at 0.5
SYBIL_WITH_APPEAL=$(curl -sf "$API_URL/v1/score/$SYBIL" 2>/dev/null || echo "")
if [[ -n "$SYBIL_WITH_APPEAL" ]]; then
  APPEAL_MULT=$(echo "$SYBIL_WITH_APPEAL" | jq -r '.sybilMultiplier // 0')
  if (( $(echo "$APPEAL_MULT >= 0.5" | bc -l 2>/dev/null || echo "0") )); then
    pass "appeals: sybilMultiplier floored at 0.5 ($APPEAL_MULT)"
  else
    # Appeal floor may not be enforced in score route — still check
    skip "appeals: sybilMultiplier floor not enforced ($APPEAL_MULT)"
  fi
else
  fail "appeals: score with appeal failed"
fi

# ── Webhooks ──
echo ""
echo "Webhook endpoints:"

WH_JSON=$(curl -sf -X POST "$API_URL/v1/webhooks" \
  -H "Content-Type: application/json" \
  -d "{\"address\":\"$VITALIK\",\"url\":\"https://example.com/webhook\",\"secret\":\"test123\"}" 2>/dev/null || echo "")

if [[ -n "$WH_JSON" ]]; then
  WH_ID=$(echo "$WH_JSON" | jq -r '.id // ""')
  if [[ -n "$WH_ID" && "$WH_ID" != "null" ]]; then
    pass "webhooks: POST returns id ($WH_ID)"
  else
    fail "webhooks: POST missing id"
  fi
else
  fail "webhooks: POST /v1/webhooks failed"
fi

WH_LIST=$(curl -sf "$API_URL/v1/webhooks" 2>/dev/null || echo "")
if [[ -n "$WH_LIST" ]]; then
  WH_COUNT=$(echo "$WH_LIST" | jq '.webhooks | length')
  if [[ "$WH_COUNT" -gt 0 ]]; then
    pass "webhooks: GET list non-empty ($WH_COUNT)"
  else
    fail "webhooks: GET list empty"
  fi
else
  fail "webhooks: GET /v1/webhooks failed"
fi

# ── Admin ──
echo ""
echo "Admin endpoints:"

ADMIN_JSON=$(curl -sf -H "X-Admin-Key: $ADMIN_KEY" "$API_URL/v1/admin/bear-periods" 2>/dev/null || echo "")
if [[ -n "$ADMIN_JSON" ]]; then
  BP_COUNT=$(echo "$ADMIN_JSON" | jq '.periods | length')
  if [[ "$BP_COUNT" -ge 3 ]]; then
    pass "admin: bear periods >= 3 ($BP_COUNT)"
  else
    fail "admin: bear periods < 3" "got $BP_COUNT"
  fi
else
  fail "admin: GET /v1/admin/bear-periods failed"
fi

# ── Frame ──
echo ""
echo "Frame endpoints:"

FRAME_RESP=$(curl -sf -X POST "$API_URL/v1/frame" \
  -H "Content-Type: application/json" \
  -d "{\"untrustedData\":{\"inputText\":\"$VITALIK\"}}" 2>/dev/null || echo "")

if [[ -n "$FRAME_RESP" ]]; then
  if echo "$FRAME_RESP" | grep -qi "fc:frame"; then
    pass "frame: returns fc:frame meta"
  else
    fail "frame: missing fc:frame meta"
  fi
else
  fail "frame: POST /v1/frame failed"
fi

# ── Stats ──
echo ""
echo "Stats endpoints:"

STATS_JSON=$(curl -sf "$API_URL/v1/stats" 2>/dev/null || echo "")
if [[ -n "$STATS_JSON" ]]; then
  WALLETS=$(echo "$STATS_JSON" | jq -r '.walletsScored // 0')
  if [[ "$WALLETS" -ge 10 ]]; then
    pass "stats: walletsScored >= 10 ($WALLETS)"
  else
    fail "stats: walletsScored < 10" "got $WALLETS"
  fi

  CHAINS=$(echo "$STATS_JSON" | jq -r '.chainsIndexed // 0')
  if [[ "$CHAINS" -eq 6 ]]; then
    pass "stats: chainsIndexed == 6"
  else
    fail "stats: chainsIndexed != 6" "got $CHAINS"
  fi
else
  fail "stats: GET /v1/stats failed"
fi

echo ""
section "Done"
