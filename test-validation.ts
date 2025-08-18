import { Database } from "bun:sqlite";
import { execute } from "./engine";
import { contracts, evmClient } from "./evm";

console.log("Testing SQL Engine with Address Validation...");

// Register actor if not already registered
try {
  await contracts
    .seiqlOrchestrator()
    .write.registerActor([
      evmClient.account.address,
      evmClient.account.address,
    ]);
  console.log("✅ Actor registered");
} catch (error: any) {
  if (!error.message?.includes("already registered")) {
    console.log("❌ Failed to register actor:", error.message);
  } else {
    console.log("✅ Actor already registered");
  }
}

// Create database if not exists
try {
  await contracts
    .seiqlOrchestrator()
    .write.createDatabase(["test_validation_db"]);
  console.log("✅ Database created");
} catch (error: any) {
  if (!error.message?.includes("already exists")) {
    console.log("❌ Failed to create database:", error.message);
  } else {
    console.log("✅ Database already exists");
  }
}

// Test CREATE TABLE with ADDRESS type
try {
  await execute({
    name: "test_validation_db",
    owner: evmClient.account.address,
    query: `CREATE TABLE IF NOT EXISTS wallets (
              id INTEGER PRIMARY KEY,
              wallet_address ADDRESS,
              is_verified BOOL,
              balance INTEGER
            );`,
  });
  console.log("✅ Table created successfully");
} catch (error: any) {
  console.log("❌ Failed to create table:", error.message);
}

// Test INSERT with valid address
try {
  await execute({
    name: "test_validation_db",
    owner: evmClient.account.address,
    query: `INSERT INTO wallets (wallet_address, is_verified, balance)
            VALUES ("0xc37cB62C6Ad31842D8ba5c748f972d63C3f60569", true, 1000);`,
  });
  console.log("✅ INSERT with valid address succeeded");
} catch (error: any) {
  console.log("❌ Failed to insert valid address:", error.message);
}

// Test INSERT with invalid address (should fail validation)
try {
  await execute({
    name: "test_validation_db",
    owner: evmClient.account.address,
    query: `INSERT INTO wallets (wallet_address, is_verified, balance)
            VALUES ("invalid_address", true, 500);`,
  });
  console.log("❌ INSERT with invalid address should have failed!");
} catch (error: any) {
  console.log(
    "✅ INSERT with invalid address correctly failed:",
    error.message
  );
}

// Test INSERT with lowercase address (should be validated)
try {
  await execute({
    name: "test_validation_db",
    owner: evmClient.account.address,
    query: `INSERT INTO wallets (wallet_address, is_verified, balance)
            VALUES ("0xabcdef1234567890abcdef1234567890abcdef12", false, 250);`,
  });
  console.log("✅ INSERT with lowercase address succeeded");
} catch (error: any) {
  console.log("❌ Failed to insert lowercase address:", error.message);
}

console.log("\n🎉 Address validation testing completed!");
