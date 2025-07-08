// import sqlite3 from 'sqlite3';
// import { open } from 'sqlite';

// this is just a sample function to get the columns of a table need to be replaced with the actual database connection logic
export async function getTableColumns(tableName: string): Promise<string[]> {
  // const db = await open({
  //   filename: './your-database.sqlite',
  //   driver: sqlite3.Database,
  // });

  // const rows = await db.all(⁠ PRAGMA table_info(${tableName}) ⁠);
  // await db.close();

  // return rows
  //   .map((row: any) => row.name)
  //   .filter((col: string) => !col.startsWith('sei_caret_'));
  return new Promise((resolve) => {
    // Simulating database call with a timeout
    setTimeout(() => {
      resolve([
        "id",
        "name",
        "created_at",
        "updated_at",
        // Add more columns as needed
      ]);
    }, 1000);
  });
}
