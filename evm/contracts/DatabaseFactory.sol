// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Database.sol";
import "./AuxillaryListUint256.sol";

contract DatabaseFactory {
    mapping(address => AuxillaryListUint256) public databasesByOwner;
    address[] public databases;

    event DatabaseCreated(address indexed creator, address indexed dbAddress);

    function createDatabase(address owner_, address actor_) external {
        Database newDatabase = new Database(owner_, actor_);
        if (databasesByOwner[owner_].length() == 0) {
            databasesByOwner[owner_] = new AuxillaryListUint256();
        }

        databasesByOwner[owner_].add(databases.length);
        databases.push(address(newDatabase));

        emit DatabaseCreated(owner_, address(newDatabase));
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
