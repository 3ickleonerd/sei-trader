// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Database.sol";
import "./AuxillaryListUint256.sol";

contract DatabaseFactory {
    mapping(address => AuxillaryListUint256) public databasesByOwner;
    address[] public databases;

    event DatabaseCreated(address indexed creator, address indexed dbAddress);

    function createDatabase() external {
        require(
            databasesByOwner[msg.sender].length() == 0,
            "You already have a database"
        );

        AuxillaryListUint256 newDatabase = new AuxillaryListUint256();
        databasesByOwner[msg.sender] = newDatabase;
        databases.push(address(newDatabase));

        emit DatabaseCreated(msg.sender, address(newDatabase));
    }

    function getDatabases() external view returns (address[] memory) {
        return databases;
    }

    function getDatabaseIndicesByOwner(
        address owner_
    ) external view returns (uint256[] memory) {
        return databasesByOwner[owner_].getAll();
    }

    function getDatabase(uint256 index_) external view returns (address) {
        require(index_ < databases.length, "Index out of bounds");

        return databases[index_];
    }
}
