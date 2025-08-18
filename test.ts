import { Database } from "bun:sqlite";
import { execute } from "./engine";
import { contracts, evmClient } from "./evm";

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

await fetch("http://localhost:3040/db", {
  method: "POST",
});

try {
  await execute({
    name: "test_db",
    owner: evmClient.account.address,
    query: `CREATE TABLE IF NOT EXISTS accounts (
              id INTEGER PRIMARY KEY,
              wallet ADDRESS,
              is_active BOOL,
              balance INTEGER
            );`,
  });
} catch (_) {}

await execute({
  name: "test_db",
  owner: evmClient.account.address,
  query: `INSERT INTO accounts (wallet, is_active, balance)
          VALUES ("0xc37cB62C6Ad31842D8ba5c748f972d63C3f60569", false, 0);`,
});
