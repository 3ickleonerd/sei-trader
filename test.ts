import { Database } from "bun:sqlite";

const db = new Database();
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    age INTEGER
  );
`);

db.exec(`INSERT INTO users (name, age) VALUES ('Alice', 30);`);
db.exec(`INSERT INTO users (name, age) VALUES ('Bob', 25);`);
db.exec(`INSERT INTO users (name, age) VALUES ('Charlie', 35);`);
db.exec(`INSERT INTO users (name, age) VALUES ('Diana', 28);`);

const old = db.serialize();

const res = db.query(`DELETE FROM users WHERE age>32 returning *;`).all();

console.log("Result:", res);

console.log(Database.deserialize(old).query(`SELECT * FROM users;`).all());
