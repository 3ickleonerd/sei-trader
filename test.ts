import { Database } from "bun:sqlite";

import { execute } from "./engine";

// Test all custom types
execute({
  name: "test_db",
  owner: "0x1234567890abcdef1234567890abcdef12345678",
  query:
    "CREATE TABLE accounts (id INTEGER PRIMARY KEY, wallet ADDRESS, is_active BOOL, balance FLOAT, created_at INTEGER);",
});

// const db = new Database();
// db.exec(`
//   CREATE TABLE IF NOT EXISTS users (
//     id INTEGER PRIMARY KEY,
//     name TEXT,
//     age INTEGER
//   );
// `);

// db.exec(`INSERT INTO users (name, age) VALUES ('Alice', 30);`);
// db.exec(`INSERT INTO users (name, age) VALUES ('Bob', 25);`);
// db.exec(`INSERT INTO users (name, age) VALUES ('Charlie', 35);`);
// db.exec(`INSERT INTO users (name, age) VALUES ('Diana', 28);`);

// const old = db.serialize();

// const res = db
//   .query(
//     `
//   CREATE TABLE IF NOT EXISTS users (
//     id INTEGER PRIMARY KEY,
//     name TEXT,
//     age INTEGER
//   );`
//   )
//   .all();

// console.log("Result:", res);

// console.log(Database.deserialize(old).query(`SELECT * FROM users;`).all());
