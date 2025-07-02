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
        address newDatabase = address(new Database());
        databases.push(newDatabase);
        emit DatabaseCreated(newDatabase, name_, msg.sender);
    }

    function getDatabases() external view returns (address[] memory) {
        return databases;
    }
}
