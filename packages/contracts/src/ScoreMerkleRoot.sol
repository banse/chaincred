// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title ScoreMerkleRoot
/// @notice Publishes weekly Merkle root for trustless score verification
contract ScoreMerkleRoot is Ownable {
    bytes32 public merkleRoot;
    uint256 public lastUpdated;
    uint256 public epoch;

    error ZeroRoot();
    error ZeroAddress();
    error ScoreOutOfRange();

    event MerkleRootUpdated(bytes32 indexed root, uint256 indexed epoch, uint256 timestamp);

    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
    }

    /// @notice Publish a new Merkle root (called weekly by ChainCred operator)
    function updateMerkleRoot(bytes32 root) external onlyOwner {
        if (root == bytes32(0)) revert ZeroRoot();
        merkleRoot = root;
        lastUpdated = block.timestamp;
        epoch++;
        emit MerkleRootUpdated(root, epoch, block.timestamp);
    }

    /// @notice Verify a wallet's score is included in the current Merkle tree
    /// @param account The wallet address
    /// @param score The claimed score (0–1000)
    /// @param proof The Merkle proof
    function verifyScore(
        address account,
        uint256 score,
        bytes32[] calldata proof
    ) external view returns (bool) {
        if (account == address(0)) revert ZeroAddress();
        if (score > 1000) revert ScoreOutOfRange();
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(account, score))));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }
}
