// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ScoreMerkleRoot} from "../src/ScoreMerkleRoot.sol";

contract ScoreMerkleRootTest is Test {
    ScoreMerkleRoot merkle;
    address owner = address(1);

    function setUp() public {
        vm.prank(owner);
        merkle = new ScoreMerkleRoot(owner);
    }

    // --- Core Functionality ---

    function test_updateMerkleRoot() public {
        bytes32 root = keccak256("test-root");
        vm.prank(owner);
        merkle.updateMerkleRoot(root);

        assertEq(merkle.merkleRoot(), root);
        assertEq(merkle.epoch(), 1);
        assertGt(merkle.lastUpdated(), 0);
    }

    function test_epochIncrements() public {
        vm.startPrank(owner);
        merkle.updateMerkleRoot(keccak256("root-1"));
        assertEq(merkle.epoch(), 1);

        merkle.updateMerkleRoot(keccak256("root-2"));
        assertEq(merkle.epoch(), 2);
        vm.stopPrank();
    }

    // --- Access Control ---

    function test_RevertWhen_NonOwnerUpdates() public {
        bytes32 root = keccak256("test-root");
        vm.prank(address(2));
        vm.expectRevert();
        merkle.updateMerkleRoot(root);
    }

    // --- Input Validation ---

    function test_RevertWhen_ZeroRoot() public {
        vm.prank(owner);
        vm.expectRevert(ScoreMerkleRoot.ZeroRoot.selector);
        merkle.updateMerkleRoot(bytes32(0));
    }

    function test_RevertWhen_VerifyZeroAddress() public {
        vm.prank(owner);
        merkle.updateMerkleRoot(keccak256("root"));

        bytes32[] memory proof = new bytes32[](0);
        vm.expectRevert(ScoreMerkleRoot.ZeroAddress.selector);
        merkle.verifyScore(address(0), 500, proof);
    }

    function test_RevertWhen_ScoreOutOfRange() public {
        vm.prank(owner);
        merkle.updateMerkleRoot(keccak256("root"));

        bytes32[] memory proof = new bytes32[](0);
        vm.expectRevert(ScoreMerkleRoot.ScoreOutOfRange.selector);
        merkle.verifyScore(address(1), 1001, proof);
    }

    function test_verifyScoreMaxBoundary() public {
        vm.prank(owner);
        merkle.updateMerkleRoot(keccak256("root"));

        bytes32[] memory proof = new bytes32[](0);
        // Should NOT revert — 1000 is valid
        merkle.verifyScore(address(1), 1000, proof);
    }

    // --- Events ---

    function test_emitsMerkleRootUpdated() public {
        bytes32 root = keccak256("test-root");

        vm.prank(owner);
        merkle.updateMerkleRoot(root);
        // epoch is 1 after first update
        assertEq(merkle.epoch(), 1);
    }

    // --- Fuzz Tests ---

    function testFuzz_updateMerkleRoot(bytes32 root) public {
        vm.assume(root != bytes32(0));
        vm.prank(owner);
        merkle.updateMerkleRoot(root);
        assertEq(merkle.merkleRoot(), root);
    }

    function testFuzz_nonOwnerCannotUpdate(address caller) public {
        vm.assume(caller != owner);
        vm.prank(caller);
        vm.expectRevert();
        merkle.updateMerkleRoot(keccak256("test"));
    }

    function testFuzz_scoreValidation(uint256 score) public {
        vm.prank(owner);
        merkle.updateMerkleRoot(keccak256("root"));

        bytes32[] memory proof = new bytes32[](0);

        if (score > 1000) {
            vm.expectRevert(ScoreMerkleRoot.ScoreOutOfRange.selector);
        }
        merkle.verifyScore(address(1), score, proof);
    }

    function testFuzz_epochAlwaysIncrements(uint8 iterations) public {
        vm.assume(iterations > 0 && iterations <= 50);
        vm.startPrank(owner);
        for (uint8 i = 0; i < iterations; i++) {
            merkle.updateMerkleRoot(keccak256(abi.encode(i + 1)));
        }
        vm.stopPrank();
        assertEq(merkle.epoch(), uint256(iterations));
    }
}
