// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./DatabaseFactory.sol";
import "./ActorRegistry.sol";

contract CaretOrchestrator {
    DatabaseFactory public databaseFactory;
    ActorRegistry public actorRegistry;

    address public server;

    modifier onlyServer() {
        require(msg.sender == server, "Only the server can call this function");
        _;
    }

    constructor() {
        server = msg.sender;
        databaseFactory = new DatabaseFactory();
        actorRegistry = new ActorRegistry();
    }

    function registerActor(address owner_, address actor_) external onlyServer {
        actorRegistry.registerActor(owner_, actor_);
    }

    function createDatabase() external {
        require(actorRegistry.isRegistered(msg.sender), "Actor not registered");
        address owner = msg.sender;
        address actor = actorRegistry.getActor(owner);
        databaseFactory.createDatabase(owner, actor);
    }
}
