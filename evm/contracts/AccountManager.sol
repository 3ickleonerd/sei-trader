// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AccountManager {
    mapping(address => bool) private _registered;
    mapping(address => address) private _accounts;
    address[] private _accountsList;

    event AccountRegistered(address indexed owner, address indexed account);

    function registerAccount(address owner_, address account_) external {
        require(!_registered[owner_], "Account already registered");
        require(account_ != address(0), "Invalid account address");

        _registered[owner_] = true;
        _accounts[owner_] = account_;

        emit AccountRegistered(owner_, account_);
    }

    function isRegistered(address owner_) external view returns (bool) {
        return _registered[owner_];
    }

    function getAccount(address owner_) external view returns (address) {
        require(_registered[owner_], "Account not registered");
        return _accounts[owner_];
    }
}
