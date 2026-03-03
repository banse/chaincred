// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BadgeResolver} from "../src/BadgeResolver.sol";

contract BadgeResolverTest is Test {
    BadgeResolver resolver;
    address owner = address(1);
    address eas = address(2);
    address attestor = address(3);

    function setUp() public {
        vm.prank(owner);
        resolver = new BadgeResolver(owner, eas, attestor);
    }

    // --- Constructor Validation ---

    function test_RevertWhen_ZeroOwner() public {
        // OZ Ownable reverts with OwnableInvalidOwner before our ZeroAddress check
        vm.expectRevert(abi.encodeWithSignature("OwnableInvalidOwner(address)", address(0)));
        new BadgeResolver(address(0), eas, attestor);
    }

    function test_RevertWhen_ZeroEAS() public {
        vm.expectRevert(BadgeResolver.ZeroAddress.selector);
        new BadgeResolver(owner, address(0), attestor);
    }

    function test_RevertWhen_ZeroAttestor() public {
        vm.expectRevert(BadgeResolver.ZeroAddress.selector);
        new BadgeResolver(owner, eas, address(0));
    }

    // --- Badge Types ---

    function test_defaultBadgeTypesRegistered() public view {
        assertTrue(resolver.validBadgeTypes(keccak256("builder")));
        assertTrue(resolver.validBadgeTypes(keccak256("governor")));
        assertTrue(resolver.validBadgeTypes(keccak256("explorer")));
        assertTrue(resolver.validBadgeTypes(keccak256("og")));
        assertTrue(resolver.validBadgeTypes(keccak256("multichain")));
        assertTrue(resolver.validBadgeTypes(keccak256("trusted")));
        assertTrue(resolver.validBadgeTypes(keccak256("power-user")));
    }

    function test_invalidBadgeTypeNotRegistered() public view {
        assertFalse(resolver.validBadgeTypes(keccak256("nonexistent")));
    }

    // --- EAS Callbacks ---

    function test_onAttestFromEAS() public {
        vm.prank(eas);
        bool result = resolver.onAttest("", 0);
        assertTrue(result);
    }

    function test_RevertWhen_onAttestFromNonEAS() public {
        vm.prank(address(99));
        vm.expectRevert(BadgeResolver.OnlyEAS.selector);
        resolver.onAttest("", 0);
    }

    function test_onRevokeFromEAS() public {
        vm.prank(eas);
        bool result = resolver.onRevoke("", 0);
        assertTrue(result);
    }

    function test_RevertWhen_onRevokeFromNonEAS() public {
        vm.prank(address(99));
        vm.expectRevert(BadgeResolver.OnlyEAS.selector);
        resolver.onRevoke("", 0);
    }

    // --- Admin Functions ---

    function test_setAttestor() public {
        address newAttestor = address(4);
        vm.prank(owner);
        resolver.setAttestor(newAttestor);
        assertEq(resolver.attestor(), newAttestor);
    }

    function test_RevertWhen_SetAttestorZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(BadgeResolver.ZeroAddress.selector);
        resolver.setAttestor(address(0));
    }

    function test_RevertWhen_NonOwnerSetsAttestor() public {
        vm.prank(address(99));
        vm.expectRevert();
        resolver.setAttestor(address(4));
    }

    function test_easIsImmutable() public view {
        assertEq(resolver.eas(), eas);
    }

    // --- Events ---

    function test_emitsAttestorUpdated() public {
        address newAttestor = address(5);

        vm.expectEmit(true, false, false, false);
        emit BadgeResolver.AttestorUpdated(newAttestor);

        vm.prank(owner);
        resolver.setAttestor(newAttestor);
    }

    function test_emitsBadgeTypeUpdated() public {
        bytes32 hash = keccak256("new-badge");

        vm.expectEmit(true, false, false, true);
        emit BadgeResolver.BadgeTypeUpdated(hash, true);

        vm.prank(owner);
        resolver.setBadgeType(hash, true);
    }

    // --- Fuzz Tests ---

    function testFuzz_onlyEASCanAttest(address caller) public {
        vm.assume(caller != eas);
        vm.prank(caller);
        vm.expectRevert(BadgeResolver.OnlyEAS.selector);
        resolver.onAttest("", 0);
    }

    function testFuzz_onlyEASCanRevoke(address caller) public {
        vm.assume(caller != eas);
        vm.prank(caller);
        vm.expectRevert(BadgeResolver.OnlyEAS.selector);
        resolver.onRevoke("", 0);
    }

    function testFuzz_setAttestorNonZero(address newAttestor) public {
        vm.assume(newAttestor != address(0));
        vm.prank(owner);
        resolver.setAttestor(newAttestor);
        assertEq(resolver.attestor(), newAttestor);
    }

    function testFuzz_setBadgeType(bytes32 hash, bool valid) public {
        vm.prank(owner);
        resolver.setBadgeType(hash, valid);
        assertEq(resolver.validBadgeTypes(hash), valid);
    }
}
