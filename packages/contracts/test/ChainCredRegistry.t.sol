// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ChainCredRegistry} from "../src/ChainCredRegistry.sol";

contract ChainCredRegistryTest is Test {
    ChainCredRegistry registry;
    address owner = address(1);
    address admin = address(2);
    address user = address(3);

    function setUp() public {
        vm.prank(owner);
        registry = new ChainCredRegistry(owner);

        vm.prank(owner);
        registry.setAdmin(admin, true);
    }

    // --- Access Control ---

    function test_ownerCanSetSchemaUID() public {
        bytes32 uid = keccak256("test-schema");
        vm.prank(owner);
        registry.setScoreSchemaUID(uid);
        assertEq(registry.scoreSchemaUID(), uid);
    }

    function test_adminCanSetSchemaUID() public {
        bytes32 uid = keccak256("test-schema");
        vm.prank(admin);
        registry.setScoreSchemaUID(uid);
        assertEq(registry.scoreSchemaUID(), uid);
    }

    function test_RevertWhen_NonAdminSetsSchemaUID() public {
        bytes32 uid = keccak256("test-schema");
        vm.prank(user);
        vm.expectRevert(ChainCredRegistry.NotAdmin.selector);
        registry.setScoreSchemaUID(uid);
    }

    function test_RevertWhen_NonOwnerSetsAdmin() public {
        vm.prank(user);
        vm.expectRevert();
        registry.setAdmin(address(4), true);
    }

    // --- Pause ---

    function test_pauseUnpause() public {
        vm.prank(admin);
        registry.pause();
        assertTrue(registry.paused());

        vm.prank(owner);
        registry.unpause();
        assertFalse(registry.paused());
    }

    function test_RevertWhen_SetSchemaWhilePaused() public {
        vm.prank(admin);
        registry.pause();

        vm.prank(owner);
        vm.expectRevert();
        registry.setScoreSchemaUID(keccak256("test"));
    }

    function test_RevertWhen_NonOwnerUnpauses() public {
        vm.prank(admin);
        registry.pause();

        vm.prank(admin);
        vm.expectRevert();
        registry.unpause();
    }

    // --- Input Validation ---

    function test_RevertWhen_SetAdminZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ChainCredRegistry.ZeroAddress.selector);
        registry.setAdmin(address(0), true);
    }

    function test_RevertWhen_ExcludeZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(ChainCredRegistry.ZeroAddress.selector);
        registry.setExcluded(address(0), true);
    }

    function test_excludeAddress() public {
        vm.prank(admin);
        registry.setExcluded(user, true);
        assertTrue(registry.excludedAddresses(user));
    }

    // --- Events ---

    function test_emitsSchemaUpdated() public {
        vm.expectEmit(false, false, false, true);
        emit ChainCredRegistry.SchemaUpdated("score", keccak256("test"));

        vm.prank(owner);
        registry.setScoreSchemaUID(keccak256("test"));
    }

    function test_emitsAdminUpdated() public {
        vm.expectEmit(true, false, false, true);
        emit ChainCredRegistry.AdminUpdated(address(5), true);

        vm.prank(owner);
        registry.setAdmin(address(5), true);
    }

    // --- Fuzz Tests ---

    function testFuzz_setAndReadSchemaUID(bytes32 uid) public {
        vm.prank(owner);
        registry.setScoreSchemaUID(uid);
        assertEq(registry.scoreSchemaUID(), uid);
    }

    function testFuzz_nonAdminCannotSetSchema(address caller) public {
        vm.assume(caller != owner && caller != admin);
        vm.prank(caller);
        vm.expectRevert(ChainCredRegistry.NotAdmin.selector);
        registry.setScoreSchemaUID(keccak256("test"));
    }

    function testFuzz_setAdminNonZero(address account) public {
        vm.assume(account != address(0));
        vm.prank(owner);
        registry.setAdmin(account, true);
        assertTrue(registry.admins(account));
    }
}
