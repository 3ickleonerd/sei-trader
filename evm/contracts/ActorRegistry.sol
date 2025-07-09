// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ActorRegistry {
    mapping(address => bool) private _registered;
    mapping(address => address) private _actors;
    address[] private _actorsList;

    event ActorRegistered(address indexed owner, address indexed actor);

    function registerActor(address owner_, address actor_) external {
        require(!_registered[owner_], "Actor already registered");
        require(actor_ != address(0), "Invalid actor address");

        _registered[owner_] = true;
        _actors[owner_] = actor_;

        emit ActorRegistered(owner_, actor_);
    }

    function isRegistered(address owner_) external view returns (bool) {
        return _registered[owner_];
    }

    function getActor(address owner_) external view returns (address) {
        require(_registered[owner_], "Actor not registered");
        return _actors[owner_];
    }
}
