import { Database } from "bun:sqlite";
import { zDatabaseAccessRecord, zInfer } from "./utils/zod";
import z from "zod";
import fs from "fs";

const dbPath = "./data/access.db";
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync("./data", { recursive: true });
  fs.writeFileSync(dbPath, "");
}
const db = new Database(dbPath);

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

export function getDatabaseCount() {
  const res = db.query("SELECT COUNT(*) FROM databases").all();
  const count = (res[0] as { "COUNT(*)": number })["COUNT(*)"];
  return z.number().min(0).parse(count);
}

export function searchDatabaseAccessRecord(
  query: Pick<DatabaseAccessRecord, "owner" | "name">
) {
  const statement = db.query(
    "SELECT * FROM databases WHERE owner = ? AND name LIKE ?"
  );
  const rawResult = statement.get(
    query.owner,
    "%" + query.name.split("").join("%") + "%"
  );

  if (!rawResult) {
    return null;
  }

  const result = zDatabaseAccessRecord().parse(rawResult);
  return result;
}

export function resolveDatabaseAddress(
  options: Pick<DatabaseAccessRecord, "owner" | "name">
) {
  const result = searchDatabaseAccessRecord(options);
  if (!result) {
    return null;
  }
  return result.address;
}

export function gracefulShutdown() {
  console.log("Closing database connection...");
  db.close();
}
