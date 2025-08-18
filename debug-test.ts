import { Database } from "bun:sqlite";
import { execute } from "./engine";
import { contracts, evmClient } from "./evm";

async function test() {
  try {
    console.log("1. Setting up...");

    try {
      await contracts
        .seiqlOrchestrator()
        .write.registerActor([
          evmClient.account.address,
          evmClient.account.address,
        ]);
    } catch (_) {}

    try {
      await contracts.seiqlOrchestrator().write.createDatabase(["test_db"]);
    } catch (_) {}

    await fetch("http://localhost:3040/db", { method: "POST" });

    console.log("2. Creating table...");
    await execute({
      name: "test_db",
      owner: evmClient.account.address,
      query: `CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY, wallet ADDRESS, is_active BOOL, balance INTEGER);`,
    });

    console.log("3. Checking if table exists...");
    const database = contracts.database(
      "0xc4C9C6c58CD8fdC0d7BA0D920778ee97796D049b"
    );
    const tableNames = await database.read.tableNames();
    console.log("Table names:", tableNames);

    if (tableNames.includes("accounts")) {
      console.log("4. Getting table address...");
      try {
        const tableAddress = await database.read.getTable(["accounts"]);
        console.log("Table address:", tableAddress);
      } catch (error) {
        console.error("Error getting table address:", error);
      }
    } else {
      console.log('Table "accounts" not found in table names');
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test();
