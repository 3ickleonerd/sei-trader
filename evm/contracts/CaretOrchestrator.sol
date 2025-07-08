// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./DatabaseFactory.sol";

contract CaretOrchestrator {
    DatabaseFactory private _databaseFactory;

    constructor() {
        _databaseFactory = new DatabaseFactory();
    }
}
