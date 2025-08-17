// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AuxillaryListUint256.sol";

contract Table {
    struct ColumnType {
        string name;
        uint8 acceptedType; // 0->INTEGER, 1->FLOAT, 2->TEXT, 3->BOOL, 4->ADDRESS, 5->BLOB
    }

    ColumnType[] private _columnTypes;
    AuxillaryListUint256 private _activeColumns;

    struct Value {
        uint256 columnIndex;
        bytes data;
    }

    Value[][] private _rows;
    mapping(uint256 => bool) private _deletedRows;

    address public database;

    modifier onlyDatabase() {
        require(
            msg.sender == database,
            "Only the parent database can call this function"
        );
        _;
    }

    constructor(string[] memory columnNames_, uint8[] memory acceptedTypes_) {
        require(
            columnNames_.length == acceptedTypes_.length,
            "Column names and types length mismatch"
        );
        require(
            columnNames_.length > 0,
            "At least one column name and type must be provided"
        );

        _activeColumns = new AuxillaryListUint256();

        database = msg.sender; //Expect to be deployed by a Database contract

        for (uint256 i = 0; i < columnNames_.length; i++) {
            require(
                bytes(columnNames_[i]).length > 0,
                "Column name cannot be empty"
            );
            require(
                acceptedTypes_[i] <= 5,
                "Invalid accepted type, must be between 0 and 5"
            );

            _columnTypes.push(ColumnType(columnNames_[i], acceptedTypes_[i]));
            _activeColumns.add(i);
        }
    }

    function getActiveColumnTypes() public view returns (ColumnType[] memory) {
        ColumnType[] memory activeColumnTypes = new ColumnType[](
            _activeColumns.length()
        );
        uint256 activeIndex = 0;

        for (uint256 i = 0; i < _columnTypes.length; i++) {
            if (_activeColumns.contains(i)) {
                activeColumnTypes[activeIndex] = _columnTypes[i];
                activeIndex++;
            }
        }

        assembly {
            mstore(activeColumnTypes, activeIndex)
        }

        return activeColumnTypes;
    }

    function addColumnType(
        string memory name_,
        uint8 acceptedType_
    ) public onlyDatabase {
        require(bytes(name_).length > 0, "Column name cannot be empty");
        require(
            acceptedType_ <= 5,
            "Invalid accepted type, must be between 0 and 5"
        );

        _columnTypes.push(ColumnType(name_, acceptedType_));
        _activeColumns.add(_columnTypes.length - 1);
    }

    function addColumnTypes(
        string[] memory names_,
        uint8[] memory acceptedTypes_
    ) public onlyDatabase {
        require(
            names_.length == acceptedTypes_.length,
            "Column names and types length mismatch"
        );
        require(
            names_.length > 0,
            "At least one column name and type must be provided"
        );

        for (uint256 i = 0; i < names_.length; i++) {
            addColumnType(names_[i], acceptedTypes_[i]);
        }
    }

    function removeActiveColumn(uint256 columnIndex_) public onlyDatabase {
        require(columnIndex_ < _columnTypes.length, "Invalid column index");
        require(_activeColumns.contains(columnIndex_), "Column not active");

        _activeColumns.remove(columnIndex_);

        for (uint256 i = 0; i < _rows.length; i++) {
            delete _rows[i][columnIndex_];
        }
    }

    function renameColumnType(
        uint256 columnIndex_,
        string memory newName_
    ) public onlyDatabase {
        require(columnIndex_ < _columnTypes.length, "Invalid column index");
        _columnTypes[columnIndex_].name = newName_;
    }

    function typeCheck(uint256 columnIndex_, bytes memory data_) public view {
        require(columnIndex_ < _columnTypes.length, "Invalid column index");
        ColumnType memory columnType = _columnTypes[columnIndex_];

        if (columnType.acceptedType == 0) {
            // INTEGER
            require(data_.length > 0, "data cannot be empty");
        } else if (columnType.acceptedType == 1) {
            // FLOAT
            require(data_.length > 0, "data cannot be empty");
        } else if (columnType.acceptedType == 2) {
            // TEXT
            require(data_.length > 0, "data cannot be empty");
        } else if (columnType.acceptedType == 3) {
            // BOOL
            require(data_.length == 1, "data must be a single byte");
        } else if (columnType.acceptedType == 4) {
            // ADDRESS
            require(data_.length == 20, "data must be a 20-byte address");
        } else if (columnType.acceptedType == 5) {
            // BLOB
            require(data_.length > 0, "data cannot be empty");
        } else {
            revert("Unsupported column type");
        }
    }

    function ensureActiveColumns(uint256[] memory columnIndexes_) internal {
        for (uint256 i = 0; i < columnIndexes_.length; i++) {
            require(
                columnIndexes_[i] < _columnTypes.length,
                "Invalid column index"
            );
            if (!_activeColumns.contains(columnIndexes_[i])) {
                _activeColumns.add(columnIndexes_[i]);
            }
        }
    }

    function ensureActiveColumnsMany(
        uint256[][] memory columnIndexes_
    ) internal {
        for (uint256 i = 0; i < columnIndexes_.length; i++) {
            ensureActiveColumns(columnIndexes_[i]);
        }
    }

    function insertOne(
        uint256[] memory columnIndexes_,
        bytes[] memory values_
    ) public onlyDatabase {
        require(
            columnIndexes_.length == values_.length,
            "Column indexes and values length mismatch"
        );
        require(
            columnIndexes_.length > 0,
            "At least one column index and value must be provided"
        );

        ensureActiveColumns(columnIndexes_);

        Value[] memory newRow = new Value[](columnIndexes_.length);
        for (uint256 i = 0; i < columnIndexes_.length; i++) {
            require(
                columnIndexes_[i] < _columnTypes.length,
                "Invalid column index"
            );

            typeCheck(columnIndexes_[i], values_[i]);

            newRow[i] = Value(columnIndexes_[i], values_[i]);
        }

        _rows.push();
        Value[] storage rowStorage = _rows[_rows.length - 1];
        for (uint256 i = 0; i < newRow.length; i++) {
            rowStorage.push(newRow[i]);
        }
    }

    function insertMany(
        uint256[][] memory columnIndexes_,
        bytes[][] memory values_
    ) public onlyDatabase {
        require(
            columnIndexes_.length == values_.length,
            "Column indexes and values length mismatch"
        );
        require(
            columnIndexes_.length > 0,
            "At least one column index and value must be provided"
        );

        for (uint256 i = 0; i < columnIndexes_.length; i++) {
            insertOne(columnIndexes_[i], values_[i]);
        }
    }

    function deleteOne(uint256 rowIndex_) public onlyDatabase {
        require(rowIndex_ < _rows.length, "Row index out of bounds");
        require(!_deletedRows[rowIndex_], "Row already deleted");

        _deletedRows[rowIndex_] = true;
    }

    function deleteMany(uint256[] memory rowIndexes_) public onlyDatabase {
        for (uint256 i = 0; i < rowIndexes_.length; i++) {
            deleteOne(rowIndexes_[i]);
        }
    }

    function updateOne(
        uint256 rowIndex_,
        uint256[] memory columnIndexes_,
        bytes[] memory values_
    ) public onlyDatabase {
        require(rowIndex_ < _rows.length, "Row index out of bounds");
        require(!_deletedRows[rowIndex_], "Row already deleted");
        require(
            columnIndexes_.length == values_.length,
            "Column indexes and values length mismatch"
        );
        require(
            columnIndexes_.length > 0,
            "At least one column index and value must be provided"
        );
        ensureActiveColumns(columnIndexes_);

        for (uint256 i = 0; i < columnIndexes_.length; i++) {
            require(
                columnIndexes_[i] < _columnTypes.length,
                "Invalid column index"
            );

            typeCheck(columnIndexes_[i], values_[i]);

            _rows[rowIndex_][columnIndexes_[i]].data = values_[i];
        }
    }

    function updateMany(
        uint256[] memory rowIndexes_,
        uint256[][] memory columnIndexes_,
        bytes[][] memory values_
    ) public onlyDatabase {
        require(
            rowIndexes_.length == columnIndexes_.length &&
                rowIndexes_.length == values_.length,
            "Row indexes, column indexes and values length mismatch"
        );

        for (uint256 i = 0; i < rowIndexes_.length; i++) {
            updateOne(rowIndexes_[i], columnIndexes_[i], values_[i]);
        }
    }

    function readRow(uint256 rowIndex_) public view returns (Value[] memory) {
        require(rowIndex_ < _rows.length, "Row index out of bounds");
        require(!_deletedRows[rowIndex_], "Row already deleted");

        Value[] memory activeRow = new Value[](_activeColumns.length());
        uint256 activeIndex = 0;
        for (uint256 i = 0; i < _rows[rowIndex_].length; i++) {
            if (_activeColumns.contains(i)) {
                activeRow[activeIndex] = _rows[rowIndex_][i];
                activeIndex++;
            }
        }

        assembly {
            mstore(activeRow, activeIndex)
        }

        return activeRow;
    }
}
