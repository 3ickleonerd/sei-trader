// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// import "hardhat/console.sol";
import "./Database.sol";

contract DatabaseFactory {
    mapping(address => mapping(string => address)) public databasesByName;

    event DatabaseCreated(
        address indexed creator,
        string name,
        address indexed dbAddress
    );

    function createDatabase(string calldata name_) external {
        require(
            databasesByName[msg.sender][name_] == address(0),
            "Already name exists"
        );
        address newDatabase = address(new Database());
        databasesByName[msg.sender][name_] = newDatabase;
        emit DatabaseCreated(msg.sender, name_, newDatabase);
    }

    function getDatabases() external view returns (address[] memory) {
        return databases;
    }
}
