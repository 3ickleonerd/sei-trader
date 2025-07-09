// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./DatabaseFactory.sol";
import "./ActorManager.sol";

contract CaretOrchestrator {
    DatabaseFactory public databaseFactory;
    ActorManager public actorManager;

    address public server;

    modifier onlyServer() {
        require(msg.sender == server, "Only the server can call this function");
        _;
    }

    constructor() {
        server = msg.sender;
        databaseFactory = new DatabaseFactory();
        actorManager = new ActorManager();
    }

    function registerActor(address owner_, address actor_) external onlyServer {
        actorManager.registerActor(owner_, actor_);
    }

    function createDatabase() external {
        require(actorManager.isRegistered(msg.sender), "Actor not registered");
        address owner = msg.sender;
        address actor = actorManager.getActor(owner);
        databaseFactory.createDatabase(owner, actor);
    }
}
