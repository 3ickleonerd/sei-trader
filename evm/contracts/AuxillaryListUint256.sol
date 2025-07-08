// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.26;
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuxillaryListUint256 is Ownable {
    uint256[] private _values;
    mapping(uint256 => uint256) private _valueIndexes;
    mapping(uint256 => bool) private _valueExists;

    constructor() Ownable(msg.sender) {}

    function add(uint256 value_) public onlyOwner {
        if (_valueExists[value_]) return;

        _values.push(value_);
        _valueIndexes[value_] = _values.length - 1;
        _valueExists[value_] = true;
    }

    function safeAdd(uint256 value_) external onlyOwner {
        require(!_valueExists[value_], "Value already exists");
        add(value_);
    }

    function remove(uint256 value_) public onlyOwner {
        if (!_valueExists[value_]) return;

        uint256 deletionIndex = _valueIndexes[value_];
        uint256 lastIndex = _values.length - 1;

        // Move the last element to the place of the element to be removed
        if (deletionIndex != lastIndex) {
            uint256 lastElement = _values[lastIndex];
            _values[deletionIndex] = lastElement;
            _valueIndexes[lastElement] = deletionIndex; // Update the index for the previously last element
        }

        _values.pop();
        delete _valueIndexes[value_];
        delete _valueExists[value_];
    }

    function safeRemove(uint256 value_) external onlyOwner {
        require(_valueExists[value_], "Value does not exist");
        remove(value_);
    }

    function contains(uint256 value_) external view returns (bool) {
        return _valueExists[value_];
    }

    function indexOf(uint256 value_) external view returns (uint256) {
        return _valueIndexes[value_];
    }

    function length() external view returns (uint256) {
        return _values.length;
    }

    function getAll() external view returns (uint256[] memory) {
        return _values;
    }
}
