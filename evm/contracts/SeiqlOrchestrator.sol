// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./DatabaseFactory.sol";
import "./ActorRegistry.sol";

contract SeiqlOrchestrator {
    DatabaseFactory public databaseFactory;
    ActorRegistry public actorRegistry;

    address public server;

    bool public paused;

    modifier onlyServer() {
        require(msg.sender == server, "Only the server can call this function");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor() {
        server = msg.sender;
        databaseFactory = new DatabaseFactory();
        actorRegistry = new ActorRegistry();
        paused = false;
    }

    function pause() external onlyServer {
        require(!paused, "Already paused");
        paused = true;
    }

    function unpause() external onlyServer {
        require(paused, "Not paused");
        paused = false;
    }

    function registerActor(
        address owner_,
        address actor_
    ) external onlyServer whenNotPaused {
        actorRegistry.registerActor(owner_, actor_);
    }

    function createDatabase() external whenNotPaused {
        require(actorRegistry.isRegistered(msg.sender), "Actor not registered");
        address owner = msg.sender;
        address actor = actorRegistry.getActor(owner);
        databaseFactory.createDatabase(owner, actor);
    }
}
