// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Database.sol";
import "./AuxillaryListUint256.sol";

contract DatabaseFactory {
    mapping(address => AuxillaryList) public databasesByOwner;
    address[] public databases;

    event DatabaseCreated(address indexed creator, address indexed dbAddress);

    function createDatabase() external {
        Database newDatabase = new Database(msg.sender);
        if (databasesByOwner[msg.sender].length() == 0) {
            databasesByOwner[msg.sender] = new AuxillaryList();
        }

        databasesByOwner[msg.sender].add(databases.length);
        databases.push(address(newDatabase));

        emit DatabaseCreated(msg.sender, address(newDatabase));
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
