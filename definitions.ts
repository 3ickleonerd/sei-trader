const definitions = {
  "SeiqlOrchestrator": {
    "abi": [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [],
        "name": "actorRegistry",
        "outputs": [
          {
            "internalType": "contract ActorRegistry",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "name_",
            "type": "string"
          }
        ],
        "name": "createDatabase",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "databaseFactory",
        "outputs": [
          {
            "internalType": "contract DatabaseFactory",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "pause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "paused",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner_",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "actor_",
            "type": "address"
          }
        ],
        "name": "registerActor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "server",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "unpause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
    "address": "0x7ef8e99980da5bcedcf7c10f41e55f759f6a174b"
  },
  "DatabaseFactory": {
    "abi": [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "dbAddress",
            "type": "address"
          }
        ],
        "name": "DatabaseCreated",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner_",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "actor_",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "name_",
            "type": "string"
          }
        ],
        "name": "createDatabase",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "databases",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "name": "databasesByOwner",
        "outputs": [
          {
            "internalType": "contract AuxillaryListUint256",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "databasesCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "index_",
            "type": "uint256"
          }
        ],
        "name": "getDatabase",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner_",
            "type": "address"
          }
        ],
        "name": "getDatabaseIndicesByOwner",
        "outputs": [
          {
            "internalType": "uint256[]",
            "name": "",
            "type": "uint256[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner_",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "name_",
            "type": "string"
          }
        ],
        "name": "isDatabaseNameTaken",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "bytes32",
            "name": "",
            "type": "bytes32"
          }
        ],
        "name": "nameHashExists",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    "address": "0x61Ab51bE7C866a54B0B442c149d7715367743EfD"
  },
  "ActorRegistry": {
    "abi": [
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "actor",
            "type": "address"
          }
        ],
        "name": "ActorRegistered",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner_",
            "type": "address"
          }
        ],
        "name": "getActor",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner_",
            "type": "address"
          }
        ],
        "name": "isRegistered",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner_",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "actor_",
            "type": "address"
          }
        ],
        "name": "registerActor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
    "address": "0x59D59097E71b2cfD5D2dA470843033dbd94BE4Ef"
  },
  "Database": {
    "abi": [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner_",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "actor_",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "name_",
            "type": "string"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "tableAddress",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "tableName",
            "type": "string"
          }
        ],
        "name": "TableCreated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "tableAddress",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "tableName",
            "type": "string"
          }
        ],
        "name": "TableDropped",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "tableAddress",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "oldName",
            "type": "string"
          },
          {
            "indexed": false,
            "internalType": "string",
            "name": "newName",
            "type": "string"
          }
        ],
        "name": "TableRenamed",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "string[]",
            "name": "columnNames_",
            "type": "string[]"
          },
          {
            "internalType": "uint8[]",
            "name": "acceptedTypes_",
            "type": "uint8[]"
          },
          {
            "internalType": "string",
            "name": "tableName_",
            "type": "string"
          }
        ],
        "name": "createTable",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "index_",
            "type": "uint256"
          }
        ],
        "name": "dropTable",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "index_",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "newName_",
            "type": "string"
          }
        ],
        "name": "renameTable",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "tableNames",
        "outputs": [
          {
            "internalType": "string[]",
            "name": "",
            "type": "string[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ]
  },
  "Table": {
    "abi": [
      {
        "inputs": [
          {
            "internalType": "string[]",
            "name": "columnNames_",
            "type": "string[]"
          },
          {
            "internalType": "uint8[]",
            "name": "acceptedTypes_",
            "type": "uint8[]"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "name_",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "acceptedType_",
            "type": "uint8"
          }
        ],
        "name": "addColumnType",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string[]",
            "name": "names_",
            "type": "string[]"
          },
          {
            "internalType": "uint8[]",
            "name": "acceptedTypes_",
            "type": "uint8[]"
          }
        ],
        "name": "addColumnTypes",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "database",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256[]",
            "name": "rowIndexes_",
            "type": "uint256[]"
          }
        ],
        "name": "deleteMany",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "rowIndex_",
            "type": "uint256"
          }
        ],
        "name": "deleteOne",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getActiveColumnTypes",
        "outputs": [
          {
            "components": [
              {
                "internalType": "string",
                "name": "name",
                "type": "string"
              },
              {
                "internalType": "uint8",
                "name": "acceptedType",
                "type": "uint8"
              }
            ],
            "internalType": "struct Table.ColumnType[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256[][]",
            "name": "columnIndexes_",
            "type": "uint256[][]"
          },
          {
            "internalType": "bytes[][]",
            "name": "values_",
            "type": "bytes[][]"
          }
        ],
        "name": "insertMany",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256[]",
            "name": "columnIndexes_",
            "type": "uint256[]"
          },
          {
            "internalType": "bytes[]",
            "name": "values_",
            "type": "bytes[]"
          }
        ],
        "name": "insertOne",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "rowIndex_",
            "type": "uint256"
          }
        ],
        "name": "readRow",
        "outputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "columnIndex",
                "type": "uint256"
              },
              {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
              }
            ],
            "internalType": "struct Table.Value[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "columnIndex_",
            "type": "uint256"
          }
        ],
        "name": "removeActiveColumn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "columnIndex_",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "newName_",
            "type": "string"
          }
        ],
        "name": "renameColumnType",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "columnIndex_",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "data_",
            "type": "bytes"
          }
        ],
        "name": "typeCheck",
        "outputs": [],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256[]",
            "name": "rowIndexes_",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256[][]",
            "name": "columnIndexes_",
            "type": "uint256[][]"
          },
          {
            "internalType": "bytes[][]",
            "name": "values_",
            "type": "bytes[][]"
          }
        ],
        "name": "updateMany",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "rowIndex_",
            "type": "uint256"
          },
          {
            "internalType": "uint256[]",
            "name": "columnIndexes_",
            "type": "uint256[]"
          },
          {
            "internalType": "bytes[]",
            "name": "values_",
            "type": "bytes[]"
          }
        ],
        "name": "updateOne",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  },
  "AuxillaryListUint256": {
    "abi": [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "value_",
            "type": "uint256"
          }
        ],
        "name": "add",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "value_",
            "type": "uint256"
          }
        ],
        "name": "contains",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "getAll",
        "outputs": [
          {
            "internalType": "uint256[]",
            "name": "",
            "type": "uint256[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "value_",
            "type": "uint256"
          }
        ],
        "name": "indexOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "length",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "value_",
            "type": "uint256"
          }
        ],
        "name": "remove",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "value_",
            "type": "uint256"
          }
        ],
        "name": "safeAdd",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "value_",
            "type": "uint256"
          }
        ],
        "name": "safeRemove",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  }
} as const;
export default definitions;
