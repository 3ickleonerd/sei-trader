import { Database } from "bun:sqlite";
import { execute } from "./engine";
import { contracts, evmClient } from "./evm";

console.log("🚀 Starting comprehensive address validation test...\n");

async function runTest() {
  try {
    // Step 1: Register actor
    console.log("1️⃣ Registering actor...");
    await contracts
      .seiqlOrchestrator()
      .write.registerActor([
        evmClient.account.address,
        evmClient.account.address,
      ]);
    console.log("✅ Actor registered successfully");
  } catch (error: any) {
    console.log(
      "ℹ️ Actor already registered:",
      error.message.includes("already registered")
    );
  }

  try {
    // Step 2: Create database
    console.log("\n2️⃣ Creating database...");
    await contracts
      .seiqlOrchestrator()
      .write.createDatabase(["validation_test_db"]);
    console.log("✅ Database created successfully");
  } catch (error: any) {
    console.log(
      "ℹ️ Database already exists:",
      error.message.includes("already exists")
    );
  }

  // Step 2.5: Sync database to local access store
  console.log("\n🔄 Syncing database to local access store...");
  try {
    const response = await fetch("http://localhost:3040/db", {
      method: "POST",
    });
    const result = await response.json();
    console.log("✅ Database synced:", result);
  } catch (error: any) {
    console.log("❌ Failed to sync database:", error.message);
    console.log("ℹ️ Make sure the server is running with 'bun run server'");
    return;
  }

  try {
    // Step 3: Create table with ADDRESS column
    console.log("\n3️⃣ Creating table with ADDRESS column...");
    await execute({
      name: "validation_test_db",
      owner: evmClient.account.address,
      query: `CREATE TABLE IF NOT EXISTS wallets (
                id INTEGER PRIMARY KEY,
                owner_address ADDRESS,
                balance INTEGER,
                is_verified BOOL
              );`,
    });
    console.log("✅ Table created successfully");
  } catch (error: any) {
    console.log("❌ Failed to create table:", error.message);
    return;
  }

  // Step 4: Test valid address insertion
  console.log("\n4️⃣ Testing INSERT with valid address...");
  try {
    await execute({
      name: "validation_test_db",
      owner: evmClient.account.address,
      query: `INSERT INTO wallets (owner_address, balance, is_verified)
              VALUES ("0xc37cB62C6Ad31842D8ba5c748f972d63C3f60569", 1000, true);`,
    });
    console.log("✅ Valid address insertion succeeded");
  } catch (error: any) {
    console.log("❌ Valid address insertion failed:", error.message);
  }

  // Step 5: Test lowercase valid address
  console.log("\n5️⃣ Testing INSERT with lowercase valid address...");
  try {
    await execute({
      name: "validation_test_db",
      owner: evmClient.account.address,
      query: `INSERT INTO wallets (owner_address, balance, is_verified)
              VALUES ("0xabcdef1234567890abcdef1234567890abcdef12", 500, false);`,
    });
    console.log("✅ Lowercase valid address insertion succeeded");
  } catch (error: any) {
    console.log("❌ Lowercase valid address insertion failed:", error.message);
  }

  // Step 6: Test checksummed address
  console.log("\n6️⃣ Testing INSERT with checksummed address...");
  try {
    await execute({
      name: "validation_test_db",
      owner: evmClient.account.address,
      query: `INSERT INTO wallets (owner_address, balance, is_verified)
              VALUES ("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", 750, true);`,
    });
    console.log("✅ Checksummed address insertion succeeded");
  } catch (error: any) {
    console.log("❌ Checksummed address insertion failed:", error.message);
  }

  // Step 7: Test invalid address (should fail)
  console.log("\n7️⃣ Testing INSERT with invalid address (should fail)...");
  try {
    await execute({
      name: "validation_test_db",
      owner: evmClient.account.address,
      query: `INSERT INTO wallets (owner_address, balance, is_verified)
              VALUES ("invalid_address_123", 100, false);`,
    });
    console.log(
      "❌ UNEXPECTED: Invalid address insertion succeeded (this should have failed!)"
    );
  } catch (error: any) {
    console.log(
      "✅ EXPECTED: Invalid address insertion correctly failed:",
      error.message
    );
  }

  // Step 8: Test malformed hex address (should fail)
  console.log(
    "\n8️⃣ Testing INSERT with malformed hex address (should fail)..."
  );
  try {
    await execute({
      name: "validation_test_db",
      owner: evmClient.account.address,
      query: `INSERT INTO wallets (owner_address, balance, is_verified)
              VALUES ("0xInvalidHex123", 200, false);`,
    });
    console.log(
      "❌ UNEXPECTED: Malformed hex address insertion succeeded (this should have failed!)"
    );
  } catch (error: any) {
    console.log(
      "✅ EXPECTED: Malformed hex address insertion correctly failed:",
      error.message
    );
  }

  // Step 9: Test wrong length address (should fail)
  console.log("\n9️⃣ Testing INSERT with wrong length address (should fail)...");
  try {
    await execute({
      name: "validation_test_db",
      owner: evmClient.account.address,
      query: `INSERT INTO wallets (owner_address, balance, is_verified)
              VALUES ("0x123", 300, false);`,
    });
    console.log(
      "❌ UNEXPECTED: Wrong length address insertion succeeded (this should have failed!)"
    );
  } catch (error: any) {
    console.log(
      "✅ EXPECTED: Wrong length address insertion correctly failed:",
      error.message
    );
  }

  console.log("\n🎉 Address validation testing completed!");
  console.log("\n📊 Summary:");
  console.log("- Valid addresses should insert successfully");
  console.log("- Invalid addresses should be rejected with validation errors");
  console.log(
    "- The system validates addresses using viem's isAddress() function"
  );
  console.log("- Type mapping: ADDRESS → smart contract type 4");
}

runTest().catch(console.error);
