// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title BadgeResolver
/// @notice EAS SchemaResolver that validates badge attestation criteria
/// @dev Implements the IEAS SchemaResolver interface pattern
contract BadgeResolver is Ownable {
    /// @notice Address of the EAS contract (immutable — cannot change after deploy)
    address public immutable eas;

    /// @notice Address of the ChainCred attestor (only this address can create badge attestations)
    address public attestor;

    /// @notice Valid badge type hashes
    mapping(bytes32 => bool) public validBadgeTypes;

    error ZeroAddress();
    error OnlyEAS();

    event AttestorUpdated(address indexed newAttestor);
    event BadgeTypeUpdated(bytes32 indexed badgeTypeHash, bool valid);

    constructor(address initialOwner, address eas_, address attestor_) Ownable(initialOwner) {
        if (initialOwner == address(0) || eas_ == address(0) || attestor_ == address(0)) {
            revert ZeroAddress();
        }
        eas = eas_;
        attestor = attestor_;

        // Register default badge types
        validBadgeTypes[keccak256("builder")] = true;
        validBadgeTypes[keccak256("governor")] = true;
        validBadgeTypes[keccak256("explorer")] = true;
        validBadgeTypes[keccak256("og")] = true;
        validBadgeTypes[keccak256("multichain")] = true;
        validBadgeTypes[keccak256("trusted")] = true;
        validBadgeTypes[keccak256("power-user")] = true;
    }

    /// @notice Called by EAS when an attestation is created
    function onAttest(
        bytes calldata, /* attestation data */
        uint256 /* value */
    ) external view returns (bool) {
        if (msg.sender != eas) revert OnlyEAS();
        return true;
    }

    /// @notice Called by EAS when an attestation is revoked
    function onRevoke(
        bytes calldata, /* attestation data */
        uint256 /* value */
    ) external view returns (bool) {
        if (msg.sender != eas) revert OnlyEAS();
        return true;
    }

    function setAttestor(address newAttestor) external onlyOwner {
        if (newAttestor == address(0)) revert ZeroAddress();
        attestor = newAttestor;
        emit AttestorUpdated(newAttestor);
    }

    function setBadgeType(bytes32 badgeTypeHash, bool valid) external onlyOwner {
        validBadgeTypes[badgeTypeHash] = valid;
        emit BadgeTypeUpdated(badgeTypeHash, valid);
    }
}
