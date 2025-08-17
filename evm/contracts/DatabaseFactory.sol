// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Database.sol";
import "./AuxillaryListUint256.sol";
import "./SeiqlOrchestrator.sol";

contract DatabaseFactory {
    mapping(address => AuxillaryListUint256) public databasesByOwner;
    address[] public databases;
    SeiqlOrchestrator orchestrator;

    event DatabaseCreated(address indexed creator, address indexed dbAddress);

    constructor() {
        orchestrator = SeiqlOrchestrator(msg.sender);
    }

    function createDatabase(
        address owner_,
        address actor_,
        string memory name_
    ) external {
        require(
            msg.sender == address(orchestrator),
            "Only orchestrator can create databases"
        );

        Database newDatabase = new Database(owner_, actor_, name_);
        if (databasesByOwner[owner_].length() == 0) {
            databasesByOwner[owner_] = new AuxillaryListUint256();
        }

        databasesByOwner[owner_].add(databases.length);
        databases.push(address(newDatabase));

        emit DatabaseCreated(owner_, address(newDatabase));
    }

    function databasesCount() external view returns (uint256) {
        return databases.length;
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
