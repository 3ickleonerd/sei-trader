// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Database.sol";
import "./AuxillaryListUint256.sol";

contract DatabaseFactory {
    mapping(address => AuxillaryList) public databasesByOwner;
    address[] public databases;

    event DatabaseCreated(address indexed creator, address indexed dbAddress);

    function createDatabase() external {
        require(
            databasesByOwner[msg.sender].length() == 0,
            "You already have a database"
        );

        AuxillaryList newDatabase = new AuxillaryList();
        databasesByOwner[msg.sender] = newDatabase;
        databases.push(address(newDatabase));

        emit DatabaseCreated(msg.sender, "New Database", address(newDatabase));
    }

    function getDatabases() external view returns (address[] memory) {
        return databases;
    }
}
