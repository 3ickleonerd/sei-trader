import { Database } from "bun:sqlite";
import { zDatabaseAccessRecord, zInfer } from "./utils/zod";

const db = new Database("./data/access.db");

db.exec("PRAGMA journal_mode = WAL;");
db.exec(
  `CREATE TABLE IF NOT EXISTS databases(owner text, name text, address text);`
);

type DatabaseAccessRecord = zInfer<typeof zDatabaseAccessRecord>;

export function addDatabaseAccessRecord(record: DatabaseAccessRecord) {
  const { name, owner, address } = zDatabaseAccessRecord().parse(record);

  db.exec("INSERT INTO databases (owner, name, address) VALUES (?, ?, ?)", [
    owner,
    name,
    address,
  ]);
}

export function searchDatabaseAccessRecord(
  query: Pick<DatabaseAccessRecord, "owner" | "name">
) {
  const statement = db.query(
    "SELECT * FROM databases WHERE owner = ? AND name LIKE ?"
  );
  const result = zDatabaseAccessRecord().parse(
    statement.get(query.owner, "%" + query.owner.split("").join("%") + "%")
  );
  return result;
}

export function resolveDatabaseAddress(
  options: Pick<DatabaseAccessRecord, "owner" | "name">
) {
  const result = searchDatabaseAccessRecord(options);
  return result.address;
}

export function gracefulShutdown() {
  console.log("Closing database connection...");
  db.close();
}
