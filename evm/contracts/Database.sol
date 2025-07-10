// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AuxillaryListUint256.sol";
import "./Table.sol";

contract Database {
    address private _owner;
    address private _actor; // Actor is the address that we assign as account to owner

    address[] private _tables;
    string[] private _tableNames;

    event TableCreated(address indexed tableAddress, string tableName);

    constructor(address owner_, address actor_) {
        _owner = owner_;
        _actor = actor_;
    }

    modifier permitted() {
        require(
            msg.sender == _owner || msg.sender == _actor,
            "Not allowed to call this function"
        );
        _;
    }

    function createTable(
        Table.ColumnType[] memory columnTypes_,
        string memory tableName_
    ) external permitted {
        Table newTable = new Table(columnTypes_);
        _tables.push(address(newTable));
        _tableNames.push(tableName_);

        emit TableCreated(address(newTable), tableName_);
    }

    function dropTable(uint256 index_) external permitted {
        require(index_ < _tables.length, "Index out of bounds");

        address tableAddress = _tables[index_];
        delete _tables[index_];
        delete _tableNames[index_];

        for (uint256 i = index_; i < _tables.length - 1; i++) {
            _tables[i] = _tables[i + 1];
            _tableNames[i] = _tableNames[i + 1];
        }
        _tables.pop();
        _tableNames.pop();

        emit TableCreated(tableAddress, "");
    }

    function renameTable(
        uint256 index_,
        string memory newName_
    ) external permitted {
        require(index_ < _tableNames.length, "Index out of bounds");
        _tableNames[index_] = newName_;
    }

    function tableNames() external view returns (string[] memory) {
        return _tableNames;
    }
}
