// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CaretOrchestrator {
    address public server;

    mapping(address => address[]) public actors; //maps users to actors
    mapping(address => bool) public isActor;
    mapping(address => address) public escrows; //maps actors to escrows

    modifier onlyServer() {
        require(msg.sender == server, "Not the server");
        _;
    }

    constructor(address server_) {
        server = server_;
    }

    function registerActor(address actor_, address owner_) external onlyServer {
        require(!isActor[actor_], "Actor already registered");
        actors[owner_].push(actor_);
        isActor[actor_] = true;
    }
}
