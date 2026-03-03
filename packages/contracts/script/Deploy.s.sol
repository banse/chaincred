// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ChainCredRegistry.sol";
import "../src/ScoreMerkleRoot.sol";
import "../src/BadgeResolver.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address easAddress = vm.envAddress("EAS_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        ChainCredRegistry registry = new ChainCredRegistry(deployer);
        ScoreMerkleRoot merkle = new ScoreMerkleRoot(deployer);
        BadgeResolver resolver = new BadgeResolver(deployer, easAddress, deployer);

        vm.stopBroadcast();

        console.log("Registry:", address(registry));
        console.log("MerkleRoot:", address(merkle));
        console.log("BadgeResolver:", address(resolver));
    }
}
