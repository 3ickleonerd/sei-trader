// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./DatabaseFactory.sol";
import "./AccountManager.sol";

contract CaretOrchestrator {
    DatabaseFactory public databaseFactory;
    AccountManager public accountManager;

    address public server;

    modifier onlyServer() {
        require(msg.sender == server, "Only the server can call this function");
        _;
    }

    constructor() {
        server = msg.sender; // Expect to be deployed by a server contract
        databaseFactory = new DatabaseFactory();
        accountManager = new AccountManager();
    }

    function registerAccount(
        address owner_,
        address account_
    ) external onlyServer {
        accountManager.registerAccount(owner_, account_);
    }
}
