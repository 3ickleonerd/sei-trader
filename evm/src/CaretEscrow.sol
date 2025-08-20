// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./CaretOrchestrator.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CaretEscrow {
    address public owner;
    address public actor;
    address public orchestrator;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyActor() {
        require(msg.sender == actor, "Not the actor");
        _;
    }

    constructor(address owner_, address actor_) {
        orchestrator = msg.sender;
        owner = owner_;
        actor = actor_;
    }

    function balance(address token_) external view returns (uint256) {
        return IERC20(token_).balanceOf(address(this));
    }

    function releaseFunds(address token_, uint256 amount_) external onlyOwner {
        IERC20(token_).transfer(owner, amount_);
    }

    function fundActor(address token_, uint256 amount_) external onlyActor {
        IERC20(token_).transfer(actor, amount_);
    }
}
