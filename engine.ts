import { Address } from "viem";
import { resolveDatabaseAddress } from "./access";
import { getAugmentedQuery } from "./parse";
import { Database } from "bun:sqlite";
import { contracts, evmClient } from "./evm";

export async function execute(options: {
  query: string;
  owner: Address;
  name: string;
}) {
  // const dbAddress = resolveDatabaseAddress({
  //   name: options.name,
  //   owner: options.owner,
  // });

  // if (!dbAddress) {
  //   throw new Error("Database address not found");
  // }

  const dbAddress = `0x${Math.random().toString(36).substring(2, 15)}` as const;

  const { query, ast } = getAugmentedQuery(options.query);

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
      }

      if (ast.type === "") {
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
