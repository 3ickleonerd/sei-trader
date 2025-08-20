import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function hasRealSqlContent(content: string): boolean {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  for (const line of lines) {
    if (line.startsWith("--")) continue;
    if (line.startsWith("/*") || line.endsWith("*/")) continue;
    if (line.length > 0) {
      return true;
    }
  }

  return false;
}

function generateMigrationName(content: string): string {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  for (const line of lines) {
    if (line.startsWith("--")) continue;

    const createTableMatch = line.match(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i
    );
    if (createTableMatch) {
      return `create_${createTableMatch[1].toLowerCase()}_table`;
    }

    const alterTableMatch = line.match(/ALTER\s+TABLE\s+(\w+)/i);
    if (alterTableMatch) {
      return `alter_${alterTableMatch[1].toLowerCase()}_table`;
    }

    const dropTableMatch = line.match(
      /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i
    );
    if (dropTableMatch) {
      return `drop_${dropTableMatch[1].toLowerCase()}_table`;
    }

    const insertMatch = line.match(/INSERT\s+INTO\s+(\w+)/i);
    if (insertMatch) {
      return `insert_data_${insertMatch[1].toLowerCase()}`;
    }

    const createIndexMatch = line.match(
      /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i
    );
    if (createIndexMatch) {
      return `create_index_${createIndexMatch[1].toLowerCase()}`;
    }
  }

  return "migration";
}

async function createMigrationFromAddSql(): Promise<void> {
  const addSqlPath = join(process.cwd(), "data", "migrations", "new.sql");
  const migrationsDir = join(process.cwd(), "data", "migrations", "history");

  if (!existsSync(addSqlPath)) {
    console.error("❌ new.sql file not found at:", addSqlPath);
    console.log(
      "💡 Please create new.sql and put your SQL statements there first."
    );
    return;
  }

  try {
    const sqlContent = await readFile(addSqlPath, "utf-8");

    const trimmedContent = sqlContent.trim();
    if (!trimmedContent) {
      console.log("⚠️ new.sql is empty. Please add your SQL statements first.");
      console.log("💡 Example content for new.sql:");
      console.log("   -- Add your SQL statements here");
      console.log("   CREATE TABLE example (id INTEGER PRIMARY KEY);");
      return;
    }

    if (!hasRealSqlContent(trimmedContent)) {
      console.log(
        "⚠️ new.sql contains only comments or empty lines. Please add actual SQL statements."
      );
      console.log("💡 Example content for new.sql:");
      console.log("   CREATE TABLE example (id INTEGER PRIMARY KEY);");
      console.log("   ALTER TABLE users ADD COLUMN email TEXT;");
      console.log(
        "   INSERT INTO settings (key, value) VALUES ('app', 'ready');"
      );
      return;
    }

    console.log("📄 Found content in new.sql...");

    const timestamp = generateTimestamp();
    const migrationName = generateMigrationName(trimmedContent);
    const migrationFilename = `${timestamp}_${migrationName}.sql`;
    const migrationPath = join(migrationsDir, migrationFilename);

    if (!existsSync(migrationsDir)) {
      const { mkdir } = await import("fs/promises");
      await mkdir(migrationsDir, { recursive: true });
      console.log(`📁 Created migrations directory: ${migrationsDir}`);
    }

    if (existsSync(migrationPath)) {
      console.error(`❌ Migration file already exists: ${migrationFilename}`);
      console.log(
        "💡 This shouldn't happen due to timestamp uniqueness. Try again in a few seconds."
      );
      return;
    }

    const migrationHeader = `-- Migration created on ${
      new Date().toISOString().split("T")[0]
    }
-- Auto-generated from new.sql
-- ${migrationName.replace(/_/g, " ")}

`;

    const fullMigrationContent = migrationHeader + trimmedContent;

    await writeFile(migrationPath, fullMigrationContent, "utf-8");
    console.log(`✅ Created migration file: ${migrationFilename}`);
    console.log(`📍 Location: ${migrationPath}`);

    await writeFile(addSqlPath, "-- Add your SQL statements here\n", "utf-8");
    console.log("🧹 Cleared new.sql for next use");

    console.log("");
    console.log("🎉 Migration created successfully!");
    console.log("");
    console.log("Next steps:");
    console.log("1. Review the migration file if needed");
    console.log("2. Run migrations with: bun migrate.js");
    console.log("3. Check status with: bun migrate.js status");
  } catch (error) {
    console.error(`❌ Failed to create migration: ${error}`);
    process.exit(1);
  }
}

function showUsage(): void {
  console.log("📚 Migration Creator");
  console.log("");
  console.log("This script creates a new migration file from new.sql content.");
  console.log("");
  console.log("Usage:");
  console.log("  1. Edit new.sql and add your SQL statements");
  console.log("  2. Run: bun add.ts");
  console.log("  3. A new timestamped migration file will be created");
  console.log("  4. new.sql will be cleared for next use");
  console.log("");
  console.log("Examples of SQL you can put in new.sql:");
  console.log("  CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);");
  console.log("  ALTER TABLE users ADD COLUMN email TEXT;");
  console.log("  CREATE INDEX idx_users_email ON users(email);");
  console.log("  INSERT INTO settings (key, value) VALUES ('version', '1.0');");
  console.log("");
}

async function main(): Promise<void> {
  const [, , command] = process.argv;

  if (command === "help" || command === "--help" || command === "-h") {
    showUsage();
    return;
  }

  console.log("🚀 Creating migration from new.sql...");
  console.log("");

  await createMigrationFromAddSql();
}

if (import.meta.main) {
  main().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
}

export {
  createMigrationFromAddSql,
  generateTimestamp,
  generateMigrationName,
  hasRealSqlContent,
};
