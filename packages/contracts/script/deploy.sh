#!/usr/bin/env bash
set -euo pipefail

# ChainCred contract deployment script
# Usage:
#   ./script/deploy.sh sepolia    # Deploy to Sepolia testnet
#   ./script/deploy.sh mainnet    # Deploy to Ethereum mainnet
#
# Required environment variables:
#   DEPLOYER_PRIVATE_KEY  — Private key of the deployer account
#   ETHERSCAN_API_KEY     — For contract verification
#
# Optional:
#   EAS_ADDRESS           — EAS contract address (defaults per network)

NETWORK="${1:-sepolia}"

# EAS contract addresses per network
declare -A EAS_ADDRESSES=(
  ["sepolia"]="0xC2679fBD37d54388Ce493F1DB75320D236e1815e"
  ["mainnet"]="0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587"
)

# RPC endpoints
declare -A RPC_URLS=(
  ["sepolia"]="https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY:-}"
  ["mainnet"]="https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY:-}"
)

# Allow override via env
RPC_URL="${RPC_URL:-${RPC_URLS[$NETWORK]:-}}"
EAS_ADDRESS="${EAS_ADDRESS:-${EAS_ADDRESSES[$NETWORK]:-}}"

if [[ -z "$DEPLOYER_PRIVATE_KEY" ]]; then
  echo "Error: DEPLOYER_PRIVATE_KEY is required"
  exit 1
fi

if [[ -z "$RPC_URL" ]]; then
  echo "Error: RPC_URL or ALCHEMY_API_KEY is required"
  exit 1
fi

if [[ -z "$EAS_ADDRESS" ]]; then
  echo "Error: EAS_ADDRESS is required for network '$NETWORK'"
  exit 1
fi

echo "=== ChainCred Deployment ==="
echo "Network:     $NETWORK"
echo "EAS:         $EAS_ADDRESS"
echo "RPC:         ${RPC_URL:0:40}..."
echo ""

# Deploy
echo "Deploying contracts..."
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$RPC_URL" \
  --broadcast \
  --verify \
  --etherscan-api-key "${ETHERSCAN_API_KEY:-}" \
  -vvv 2>&1) || {
    echo "Deployment failed:"
    echo "$DEPLOY_OUTPUT"
    exit 1
  }

echo "$DEPLOY_OUTPUT"

# Extract addresses from output
REGISTRY=$(echo "$DEPLOY_OUTPUT" | grep "Registry:" | awk '{print $2}')
MERKLE=$(echo "$DEPLOY_OUTPUT" | grep "MerkleRoot:" | awk '{print $2}')
RESOLVER=$(echo "$DEPLOY_OUTPUT" | grep "BadgeResolver:" | awk '{print $2}')

echo ""
echo "=== Deployment Complete ==="
echo ""

# Write deployment record
DEPLOY_FILE="deployments/${NETWORK}.json"
mkdir -p deployments
cat > "$DEPLOY_FILE" <<EOF
{
  "network": "$NETWORK",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "ChainCredRegistry": "$REGISTRY",
    "ScoreMerkleRoot": "$MERKLE",
    "BadgeResolver": "$RESOLVER"
  },
  "eas": "$EAS_ADDRESS"
}
EOF

echo "Deployment record saved to $DEPLOY_FILE"
echo ""
echo "Add these to your .env:"
echo "  SCORE_MERKLE_ADDRESS=$MERKLE"
echo "  CHAINCRED_REGISTRY_ADDRESS=$REGISTRY"
echo "  BADGE_RESOLVER_ADDRESS=$RESOLVER"
