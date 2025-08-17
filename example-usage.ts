import { getAugmentedQuery } from "./parse";

// Example usage showing how to access custom types
const query =
  "CREATE TABLE users (id INTEGER PRIMARY KEY, wallet ADDRESS, is_verified BOOL, balance FLOAT);";

const { query: executableQuery, ast } = getAugmentedQuery(query);

console.log("Original query:", query);
console.log("Executable query (SQLite compatible):", executableQuery);
console.log("AST with custom types preserved:");

if (ast.type === "create" && ast.create_definitions) {
  for (const def of ast.create_definitions) {
    const customType = def.definition.dataType;
    const sqliteType = def.definition.originalDataType || customType;
    const columnName = def.column.column;

    console.log(`  - ${columnName}: ${customType} (stored as ${sqliteType})`);

    // Handle each custom type
    switch (customType) {
      case "ADDRESS":
        console.log(`    → ADDRESS validation and formatting logic here`);
        break;
      case "BOOL":
        console.log(`    → BOOL conversion (true/false ↔ 1/0) logic here`);
        break;
      case "FLOAT":
        console.log(`    → FLOAT precision and validation logic here`);
        break;
      default:
        console.log(`    → Standard ${customType} handling`);
    }
  }
}
