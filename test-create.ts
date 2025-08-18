import { Database } from "bun:sqlite";
import { execute } from "./engine";
import { contracts, evmClient } from "./evm";

async function testCreateTable() {
  try {
    console.log("Registering actor...");
    await contracts
      .seiqlOrchestrator()
      .write.registerActor([
        evmClient.account.address,
        evmClient.account.address,
      ]);
  } catch (error) {
    console.log(
      "Actor registration error (might already be registered):",
      error.message
    );
  }

  try {
    console.log("Creating database...");
    await contracts.seiqlOrchestrator().write.createDatabase(["test_db"]);
  } catch (error) {
    console.log(
      "Database creation error (might already exist):",
      error.message
    );
  }

  try {
    console.log("Creating table...");
    const result = await execute({
      name: "test_db",
      owner: evmClient.account.address,
      query: `CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY,
                wallet ADDRESS,
                is_active BOOL,
                balance INTEGER
              );`,
    });
    console.log("CREATE TABLE result:", result);
  } catch (error) {
    console.error("CREATE TABLE error:", error);
  }

  try {
    console.log("Checking if table exists...");
    const dbFactory = contracts.databaseFactory();
    const databases = await dbFactory.read.getDatabaseIndicesByOwner([
      evmClient.account.address,
    ]);
    console.log("User databases:", databases);

    if (databases.length > 0) {
      const dbAddress = await dbFactory.read.getDatabase([databases[0]]);
      console.log("Database address:", dbAddress);

      const database = contracts.database(dbAddress);

      // List all tables in the database
      try {
        const tableNames = await database.read.getTableNames();
        console.log("All tables in database:", tableNames);
      } catch (e) {
        console.log("Error getting table names:", e.message);
      }

      try {
        const tableAddress = await database.read.getTable(["accounts"]);
        console.log("Table address:", tableAddress);
      } catch (e) {
        console.log("Table lookup error:", e.message);
      }
    }
  } catch (error) {
    console.error("Database lookup error:", error);
  }
}

testCreateTable();
