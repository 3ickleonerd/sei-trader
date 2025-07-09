// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Database {
    address private _owner;

    constructor(address owner_) {
        _owner = owner_;
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "Only the owner can call this function");
        _;
    }
}
