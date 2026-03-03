// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title ChainCredRegistry
/// @notice Tracks EAS schema UIDs, admin roles, and paused state for ChainCred
contract ChainCredRegistry is Ownable, Pausable {
    /// @notice EAS schema UID for composite expertise score attestations
    bytes32 public scoreSchemaUID;

    /// @notice EAS schema UID for individual badge attestations
    bytes32 public badgeSchemaUID;

    /// @notice Mapping of admin addresses
    mapping(address => bool) public admins;

    /// @notice Mapping of excluded addresses (protocol-owned wallets, bots)
    mapping(address => bool) public excludedAddresses;

    error ZeroAddress();
    error NotAdmin();

    event SchemaUpdated(string schemaType, bytes32 uid);
    event AdminUpdated(address indexed account, bool isAdmin);
    event AddressExcluded(address indexed account, bool excluded);

    constructor(address initialOwner) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
    }

    modifier onlyAdmin() {
        if (!admins[msg.sender] && msg.sender != owner()) revert NotAdmin();
        _;
    }

    function setScoreSchemaUID(bytes32 uid) external onlyAdmin whenNotPaused {
        scoreSchemaUID = uid;
        emit SchemaUpdated("score", uid);
    }

    function setBadgeSchemaUID(bytes32 uid) external onlyAdmin whenNotPaused {
        badgeSchemaUID = uid;
        emit SchemaUpdated("badge", uid);
    }

    function setAdmin(address account, bool isAdmin_) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        admins[account] = isAdmin_;
        emit AdminUpdated(account, isAdmin_);
    }

    function setExcluded(address account, bool excluded) external onlyAdmin {
        if (account == address(0)) revert ZeroAddress();
        excludedAddresses[account] = excluded;
        emit AddressExcluded(account, excluded);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
