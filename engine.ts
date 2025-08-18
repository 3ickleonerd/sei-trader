import { Address, isAddress } from "viem";
import { resolveDatabaseAddress } from "./access";
import { getAugmentedQuery } from "./parse";
import { Database } from "bun:sqlite";
import { contracts, evmClient } from "./evm";

// Type conversion utilities for smart contract validation
function validateAndConvertValue(
  value: any,
  expectedType: number,
  columnName: string
): Uint8Array {
  switch (expectedType) {
    case 0: // INTEGER
      if (
        typeof value === "number" ||
        (typeof value === "string" && !isNaN(Number(value)))
      ) {
        const num = typeof value === "number" ? value : Number(value);
        if (!Number.isInteger(num)) {
          throw new Error(
            `Value ${value} for column ${columnName} must be an integer`
          );
        }
        // Convert to bytes (big-endian 32-byte representation)
        const buffer = new ArrayBuffer(32);
        const view = new DataView(buffer);
        view.setBigUint64(24, BigInt(num), false); // Store as 64-bit at the end of 32 bytes
        return new Uint8Array(buffer);
      }
      throw new Error(
        `Value ${value} for column ${columnName} must be a valid integer`
      );

    case 1: // FLOAT
      if (
        typeof value === "number" ||
        (typeof value === "string" && !isNaN(Number(value)))
      ) {
        const num = typeof value === "number" ? value : Number(value);
        // Convert to IEEE 754 double precision (8 bytes)
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setFloat64(0, num, false); // Big-endian
        return new Uint8Array(buffer);
      }
      throw new Error(
        `Value ${value} for column ${columnName} must be a valid number`
      );

    case 2: // TEXT
      const textValue = String(value);
      return new TextEncoder().encode(textValue);

    case 3: // BOOL
      let boolValue: boolean;
      if (typeof value === "boolean") {
        boolValue = value;
      } else if (typeof value === "string") {
        if (value.toLowerCase() === "true") boolValue = true;
        else if (value.toLowerCase() === "false") boolValue = false;
        else
          throw new Error(
            `Value ${value} for column ${columnName} must be true or false`
          );
      } else {
        throw new Error(
          `Value ${value} for column ${columnName} must be a boolean`
        );
      }
      return new Uint8Array([boolValue ? 1 : 0]);

    case 4: // ADDRESS
      const addressValue = String(value);
      if (!isAddress(addressValue)) {
        throw new Error(
          `Value ${value} for column ${columnName} must be a valid Ethereum address`
        );
      }
      // Remove 0x prefix and convert to bytes (20 bytes)
      const hexString = addressValue.slice(2);
      const addressBytes = new Uint8Array(20);
      for (let i = 0; i < 20; i++) {
        addressBytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
      }
      return addressBytes;

    case 5: // BLOB
      if (value instanceof Uint8Array) {
        return value;
      } else if (typeof value === "string") {
        // Assume hex string if starts with 0x, otherwise treat as text
        if (value.startsWith("0x")) {
          const hexString = value.slice(2);
          const bytes = new Uint8Array(hexString.length / 2);
          for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
          }
          return bytes;
        } else {
          return new TextEncoder().encode(value);
        }
      }
      throw new Error(
        `Value ${value} for column ${columnName} must be bytes or hex string`
      );

    default:
      throw new Error(
        `Unsupported column type ${expectedType} for column ${columnName}`
      );
  }
}

// Helper function to convert Uint8Array to hex string for smart contract
function uint8ArrayToHex(bytes: Uint8Array): `0x${string}` {
  return `0x${Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")}`;
}

// Helper function to get table address by name
async function getTableAddress(
  database: any,
  tableName: string
): Promise<Address> {
  try {
    return await database.read.getTable([tableName]);
  } catch (error) {
    throw new Error(`Table ${tableName} not found`);
  }
}

export async function execute(options: {
  query: string;
  owner: Address;
  name: string;
}) {
  const dbAddress = resolveDatabaseAddress({
    name: options.name,
    owner: options.owner,
  });

  if (!dbAddress) {
    throw new Error("Database address not found");
  }

  // const dbAddress = `0x${Math.random().toString(36).substring(2, 15)}` as const;

  const { query, ast, typedAst } = getAugmentedQuery(options.query);

  console.log("Generated SQL query:", query);
  const db = new Database(`./data/${dbAddress}.sqlite`);

  const old = db.serialize();

  return new Promise(async (resolve, reject) => {
    try {
      const res = db.query(query).all();

      if (ast.type === "create") {
        if (!ast.create_definitions) {
          throw new Error("No column definitions found");
        }

        const columnNames: string[] = [];
        const acceptedTypes: number[] = [];
        let tableName: string = ast.table[0].table;

        for (const def of ast.create_definitions) {
          //@ts-ignore
          const type: string = def.definition.dataType;
          //@ts-ignore
          const name: string = def.column.column;

          columnNames.push(name);
          // 0->INTEGER, 1->FLOAT, 2->TEXT, 3->BOOL, 4->ADDRESS, 5->BLOB
          if (type === "INTEGER") {
            acceptedTypes.push(0);
          } else if (type === "FLOAT") {
            acceptedTypes.push(1);
          } else if (type === "TEXT") {
            acceptedTypes.push(2);
          } else if (type === "BOOL") {
            acceptedTypes.push(3);
          } else if (type === "ADDRESS") {
            acceptedTypes.push(4);
          } else if (type === "BLOB") {
            acceptedTypes.push(5);
          } else {
            throw new Error(
              `Unsupported column type ${type} for column ${name}`
            );
          }
        }

        await contracts
          .database(dbAddress)
          .write.createTable([columnNames, acceptedTypes, tableName], {});

        resolve(res);
      } else if (ast.type === "insert") {
        console.log("INSERT AST:", JSON.stringify(ast, null, 2));

        const tableName = ast.table[0].table;

        // Get table address from database
        const database = contracts.database(dbAddress);
        const tableAddress = await getTableAddress(database, tableName);

        // Get table contract
        const table = contracts.table(tableAddress);
        const columnTypes = await table.read.getActiveColumnTypes();

        // Create column mapping
        const columnMap = new Map<string, { index: number; type: number }>();
        columnTypes.forEach((col, index) => {
          columnMap.set(col.name, { index, type: col.acceptedType });
        });

        // Validate and prepare data for each row
        const validatedRows: {
          columnIndexes: bigint[];
          values: `0x${string}`[];
        }[] = [];

        for (const valuesList of ast.values) {
          if (valuesList.type !== "expr_list") {
            throw new Error("Expected expression list for values");
          }

          const columnIndexes: bigint[] = [];
          const values: `0x${string}`[] = [];

          // Process each column-value pair
          for (let i = 0; i < ast.columns.length; i++) {
            const columnName = ast.columns[i];
            const value = valuesList.value[i];

            // Skip internal columns
            if (columnName.startsWith("sei_caret_")) {
              continue;
            }

            // Get column info
            const columnInfo = columnMap.get(columnName);
            if (!columnInfo) {
              throw new Error(
                `Column ${columnName} not found in table ${tableName}`
              );
            }

            // Extract actual value based on AST node type
            let actualValue: any;
            if (value.type === "double_quote_string") {
              actualValue = value.value;
            } else if (value.type === "number") {
              actualValue = value.value;
            } else if (value.type === "bool") {
              actualValue = value.value;
            } else if (value.validatedType === "address") {
              actualValue = value.value; // Already validated as address
            } else if (value.validatedType === "bool") {
              actualValue = value.value;
            } else if (value.validatedType === "float") {
              actualValue = value.value;
            } else {
              actualValue = value.value;
            }

            // Validate and convert value
            const convertedValue = validateAndConvertValue(
              actualValue,
              columnInfo.type,
              columnName
            );

            columnIndexes.push(BigInt(columnInfo.index));
            values.push(uint8ArrayToHex(convertedValue));
          }

          validatedRows.push({ columnIndexes, values });
        }

        // Insert data into smart contract via Database proxy
        if (validatedRows.length === 1) {
          // Single row insert
          const row = validatedRows[0];
          await database.write.insertOne([
            tableName,
            row.columnIndexes,
            row.values,
          ]);
        } else {
          // Multiple rows insert
          const allColumnIndexes = validatedRows.map(
            (row) => row.columnIndexes
          );
          const allValues = validatedRows.map((row) => row.values);
          await database.write.insertMany([
            tableName,
            allColumnIndexes,
            allValues,
          ]);
        }

        console.log(
          `Successfully inserted ${validatedRows.length} row(s) into table ${tableName}`
        );
        resolve(res);
      } else if (ast.type === "delete") {
        console.log("DELETE AST:", JSON.stringify(ast, null, 2));

        const tableName = ast.from[0].table;

        // Get table address from database
        const database = contracts.database(dbAddress);
        const tableAddress = await getTableAddress(database, tableName);
        const table = contracts.table(tableAddress);

        // For now, we'll need to implement WHERE clause parsing to get row indexes
        // This is a simplified implementation - you'd need to add WHERE clause evaluation
        const rowIndexesToDelete: bigint[] = [];

        if (ast.where) {
          // TODO: Implement WHERE clause evaluation to find matching rows
          // This would require reading table data and evaluating conditions
          throw new Error("WHERE clause evaluation not implemented yet");
        } else {
          // Delete all rows - get total row count first
          // Note: This is dangerous and should be restricted in production
          throw new Error(
            "DELETE without WHERE clause not supported for safety"
          );
        }

        if (rowIndexesToDelete.length > 0) {
          await table.write.deleteMany([rowIndexesToDelete]);
          console.log(
            `Successfully deleted ${rowIndexesToDelete.length} row(s) from table ${tableName}`
          );
        }

        resolve(res);
      } else if (ast.type === "update") {
        console.log("UPDATE AST:", JSON.stringify(ast, null, 2));

        const tableName = ast.table[0].table;

        // Get table address from database
        const database = contracts.database(dbAddress);
        const tableAddress = await getTableAddress(database, tableName);
        const table = contracts.table(tableAddress);
        const columnTypes = await table.read.getActiveColumnTypes();

        // Create column mapping
        const columnMap = new Map<string, { index: number; type: number }>();
        columnTypes.forEach((col, index) => {
          columnMap.set(col.name, { index, type: col.acceptedType });
        });

        // Process SET clause
        const columnIndexes: bigint[] = [];
        const values: `0x${string}`[] = [];

        for (const setItem of ast.set) {
          const columnName = setItem.column;
          const value = setItem.value;

          const columnInfo = columnMap.get(columnName);
          if (!columnInfo) {
            throw new Error(
              `Column ${columnName} not found in table ${tableName}`
            );
          }

          // Extract and validate value
          let actualValue: any;
          if (value.type === "double_quote_string") {
            actualValue = value.value;
          } else if (value.type === "number") {
            actualValue = value.value;
          } else if (value.type === "bool") {
            actualValue = value.value;
          } else {
            actualValue = value.value;
          }

          const convertedValue = validateAndConvertValue(
            actualValue,
            columnInfo.type,
            columnName
          );

          columnIndexes.push(BigInt(columnInfo.index));
          values.push(uint8ArrayToHex(convertedValue));
        }

        // Find rows to update using WHERE clause
        const rowIndexesToUpdate: bigint[] = [];

        if (ast.where) {
          // TODO: Implement WHERE clause evaluation
          throw new Error("WHERE clause evaluation not implemented yet");
        } else {
          // Update all rows
          throw new Error(
            "UPDATE without WHERE clause not supported for safety"
          );
        }

        if (rowIndexesToUpdate.length > 0) {
          // Prepare data for updateMany
          const allRowIndexes = rowIndexesToUpdate;
          const allColumnIndexes = rowIndexesToUpdate.map(() => columnIndexes);
          const allValues = rowIndexesToUpdate.map(() => values);

          await table.write.updateMany([
            allRowIndexes,
            allColumnIndexes,
            allValues,
          ]);
          console.log(
            `Successfully updated ${rowIndexesToUpdate.length} row(s) in table ${tableName}`
          );
        }

        resolve(res);
      } else if (ast.type === "alter") {
        console.log("ALTER AST:", JSON.stringify(ast, null, 2));

        const tableName = ast.table[0].table;

        // Get table address from database
        const database = contracts.database(dbAddress);
        const tableAddress = await getTableAddress(database, tableName);
        const table = contracts.table(tableAddress);

        for (const expr of ast.expr) {
          if (expr.action === "add") {
            // ADD COLUMN
            const columnName = expr.column.column;
            const dataType = expr.definition.dataType;

            let acceptedType: number;
            if (dataType === "INTEGER") {
              acceptedType = 0;
            } else if (dataType === "FLOAT") {
              acceptedType = 1;
            } else if (dataType === "TEXT") {
              acceptedType = 2;
            } else if (dataType === "BOOL") {
              acceptedType = 3;
            } else if (dataType === "ADDRESS") {
              acceptedType = 4;
            } else if (dataType === "BLOB") {
              acceptedType = 5;
            } else {
              throw new Error(`Unsupported column type ${dataType}`);
            }

            await table.write.addColumnType([columnName, acceptedType]);
            console.log(
              `Successfully added column ${columnName} to table ${tableName}`
            );
          } else if (expr.action === "drop") {
            // DROP COLUMN
            const columnName = expr.column.column;
            const columnTypes = await table.read.getActiveColumnTypes();
            const columnIndex = columnTypes.findIndex(
              (col) => col.name === columnName
            );

            if (columnIndex === -1) {
              throw new Error(
                `Column ${columnName} not found in table ${tableName}`
              );
            }

            await table.write.removeActiveColumn([BigInt(columnIndex)]);
            console.log(
              `Successfully dropped column ${columnName} from table ${tableName}`
            );
          } else if (expr.action === "rename") {
            // RENAME COLUMN
            const oldColumnName = expr.column.column;
            const newColumnName = expr.new_name;
            const columnTypes = await table.read.getActiveColumnTypes();
            const columnIndex = columnTypes.findIndex(
              (col) => col.name === oldColumnName
            );

            if (columnIndex === -1) {
              throw new Error(
                `Column ${oldColumnName} not found in table ${tableName}`
              );
            }

            await table.write.renameColumnType([
              BigInt(columnIndex),
              newColumnName,
            ]);
            console.log(
              `Successfully renamed column ${oldColumnName} to ${newColumnName} in table ${tableName}`
            );
          }
        }

        resolve(res);
      } else if (ast.type === "drop") {
        console.log("DROP AST:", JSON.stringify(ast, null, 2));

        if (ast.keyword !== "table") {
          throw new Error("Only DROP TABLE is supported");
        }

        const tableName = ast.name[0].table;

        // Get table index from database
        const database = contracts.database(dbAddress);
        const tableNames = await database.read.tableNames();
        const tableIndex = tableNames.findIndex((name) => name === tableName);

        if (tableIndex === -1) {
          throw new Error(`Table ${tableName} not found`);
        }

        await database.write.dropTable([BigInt(tableIndex)]);
        console.log(`Successfully dropped table ${tableName}`);

        resolve(res);
      } else {
        throw new Error(`"${ast.type}" not supported`);
      }
    } catch (error) {
      db.close();
      const revertedDb = Database.deserialize(old);
      Bun.write(`./data/${dbAddress}.sqlite`, revertedDb.serialize());
      revertedDb.close();

      console.error("An error occurred:", error);

      reject(error);
    }
  });
}
