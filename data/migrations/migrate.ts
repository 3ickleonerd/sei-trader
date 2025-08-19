import { db } from "../../db";
import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

interface MigrationRecord {
  migration_name: string;
  applied_at: string;
  checksum: string;
  execution_time_ms: number;
  applied_by: string;
}

interface MigrationFile {
  filename: string;
  fullPath: string;
  timestamp: string;
  name: string;
  content: string;
  checksum: string;
}

export class MigrationRunner {
  private migrationsDir: string;

  constructor() {
    // Get the migrations directory path
    this.migrationsDir = join(
      dirname(import.meta.url.replace("file:///", "")),
      "migrations"
    );
    // Convert Windows path format
    this.migrationsDir = this.migrationsDir.replace(/^\/([A-Z]:)/, "$1");
  }

  /**
   * Creates the migration tracking table if it doesn't exist
   */
  private createMigrationTable(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migration_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT NOT NULL,
        execution_time_ms INTEGER NOT NULL,
        applied_by TEXT DEFAULT 'system'
      )
    `;

    try {
      db.exec(createTableSQL);
      console.log("✅ Migration tracking table ready");
    } catch (error) {
      throw new Error(`Failed to create migration table: ${error}`);
    }
  }

  /**
   * Generate checksum for migration content
   */
  private generateChecksum(content: string): string {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * Get all migration files from the migrations directory
   */
  private async getMigrationFiles(): Promise<MigrationFile[]> {
    if (!existsSync(this.migrationsDir)) {
      console.log("📁 No migrations directory found, creating...");
      await require("fs/promises").mkdir(this.migrationsDir, {
        recursive: true,
      });
      return [];
    }

    const files = await readdir(this.migrationsDir);
    const sqlFiles = files.filter((file) => file.endsWith(".sql"));

    const migrations: MigrationFile[] = [];

    for (const filename of sqlFiles) {
      const fullPath = join(this.migrationsDir, filename);
      const content = await readFile(fullPath, "utf-8");

      // Parse filename: YYYYMMDDHHMMSS_description.sql
      const match = filename.match(/^(\d{14})_(.+)\.sql$/);
      if (!match) {
        console.warn(`⚠️ Skipping invalid migration filename: ${filename}`);
        continue;
      }

      const [, timestamp, name] = match;

      migrations.push({
        filename,
        fullPath,
        timestamp,
        name,
        content,
        checksum: this.generateChecksum(content),
      });
    }

    // Sort by timestamp to ensure correct order
    return migrations.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Get applied migrations from the database
   */
  private getAppliedMigrations(): MigrationRecord[] {
    try {
      const query = db.prepare(
        "SELECT * FROM migration_history ORDER BY applied_at"
      );
      return query.all() as MigrationRecord[];
    } catch (error) {
      // Table might not exist yet
      return [];
    }
  }

  /**
   * Check if a migration has been applied
   */
  private isMigrationApplied(
    migrationName: string,
    appliedMigrations: MigrationRecord[]
  ): boolean {
    return appliedMigrations.some(
      (record) => record.migration_name === migrationName
    );
  }

  /**
   * Validate migration checksum
   */
  private validateMigrationChecksum(
    migration: MigrationFile,
    appliedMigrations: MigrationRecord[]
  ): boolean {
    const appliedMigration = appliedMigrations.find(
      (record) => record.migration_name === migration.filename
    );
    if (!appliedMigration) return true; // New migration

    if (appliedMigration.checksum !== migration.checksum) {
      console.error(`❌ Migration checksum mismatch for ${migration.filename}`);
      console.error(`   Expected: ${appliedMigration.checksum}`);
      console.error(`   Actual:   ${migration.checksum}`);
      return false;
    }

    return true;
  }

  /**
   * Execute a single migration
   */
  private executeMigration(migration: MigrationFile): void {
    const startTime = Date.now();

    try {
      // Skip empty migrations or comment-only migrations
      const cleanContent = migration.content
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim();
          return trimmed && !trimmed.startsWith("--");
        })
        .join("\n")
        .trim();

      if (!cleanContent) {
        console.log(`⏭️ Skipping empty migration: ${migration.filename}`);
        return;
      }

      // Execute the migration SQL
      db.exec(migration.content);

      const executionTime = Date.now() - startTime;

      // Record the migration in history
      const insertQuery = db.prepare(`
        INSERT INTO migration_history (migration_name, checksum, execution_time_ms)
        VALUES (?, ?, ?)
      `);

      insertQuery.run(migration.filename, migration.checksum, executionTime);

      console.log(
        `✅ Applied migration: ${migration.filename} (${executionTime}ms)`
      );
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(
        `❌ Failed to apply migration: ${migration.filename} (${executionTime}ms)`
      );
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<{
    success: boolean;
    appliedCount: number;
    skippedCount: number;
    errors: string[];
  }> {
    console.log("🚀 Starting database migration...");

    const errors: string[] = [];
    let appliedCount = 0;
    let skippedCount = 0;

    try {
      // Create migration table if it doesn't exist
      this.createMigrationTable();

      // Get all migration files
      const migrationFiles = await this.getMigrationFiles();
      if (migrationFiles.length === 0) {
        console.log("📝 No migration files found");
        return { success: true, appliedCount: 0, skippedCount: 0, errors: [] };
      }

      // Get applied migrations
      const appliedMigrations = this.getAppliedMigrations();

      console.log(`📊 Found ${migrationFiles.length} migration files`);
      console.log(`📊 ${appliedMigrations.length} migrations already applied`);

      // Process each migration
      for (const migration of migrationFiles) {
        try {
          // Check if already applied
          if (this.isMigrationApplied(migration.filename, appliedMigrations)) {
            // Validate checksum for applied migrations
            if (!this.validateMigrationChecksum(migration, appliedMigrations)) {
              errors.push(
                `Checksum validation failed for ${migration.filename}`
              );
              continue;
            }
            console.log(`⏭️ Skipping already applied: ${migration.filename}`);
            skippedCount++;
            continue;
          }

          // Execute the migration
          this.executeMigration(migration);
          appliedCount++;
        } catch (error) {
          const errorMsg = `Failed to process migration ${migration.filename}: ${error}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          // Stop on first error to maintain consistency
          break;
        }
      }

      const success = errors.length === 0;

      if (success) {
        console.log(`🎉 Migration completed successfully!`);
        console.log(`📊 Applied: ${appliedCount}, Skipped: ${skippedCount}`);
      } else {
        console.log(`⚠️ Migration completed with errors`);
        console.log(
          `📊 Applied: ${appliedCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`
        );
      }

      return {
        success,
        appliedCount,
        skippedCount,
        errors,
      };
    } catch (error) {
      const errorMsg = `Migration process failed: ${error}`;
      console.error(`❌ ${errorMsg}`);
      return {
        success: false,
        appliedCount,
        skippedCount,
        errors: [errorMsg, ...errors],
      };
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    totalMigrations: number;
    appliedMigrations: number;
    pendingMigrations: string[];
    lastMigration?: MigrationRecord;
  }> {
    try {
      this.createMigrationTable();

      const migrationFiles = await this.getMigrationFiles();
      const appliedMigrations = this.getAppliedMigrations();

      const pendingMigrations = migrationFiles
        .filter(
          (migration) =>
            !this.isMigrationApplied(migration.filename, appliedMigrations)
        )
        .map((migration) => migration.filename);

      const lastMigration =
        appliedMigrations.length > 0
          ? appliedMigrations[appliedMigrations.length - 1]
          : undefined;

      return {
        totalMigrations: migrationFiles.length,
        appliedMigrations: appliedMigrations.length,
        pendingMigrations,
        lastMigration,
      };
    } catch (error) {
      throw new Error(`Failed to get migration status: ${error}`);
    }
  }

  /**
   * Reset all migrations (DANGEROUS - for development only)
   */
  async reset(): Promise<void> {
    console.log("⚠️ RESETTING ALL MIGRATIONS - THIS WILL DROP ALL DATA!");

    try {
      // Drop migration table
      db.exec("DROP TABLE IF EXISTS migration_history");
      console.log("🗑️ Dropped migration_history table");

      // You might want to drop other tables here too
      // Be careful - this is destructive!
    } catch (error) {
      throw new Error(`Failed to reset migrations: ${error}`);
    }
  }
}

// Export a default instance
export const migrationRunner = new MigrationRunner();

// CLI interface when run directly
if (import.meta.main) {
  const [, , command] = process.argv;

  switch (command) {
    case "migrate":
    case undefined:
      migrationRunner.migrate().catch(console.error);
      break;

    case "status":
      migrationRunner
        .getStatus()
        .then((status) => {
          console.log("📊 Migration Status:");
          console.log(`   Total migrations: ${status.totalMigrations}`);
          console.log(`   Applied: ${status.appliedMigrations}`);
          console.log(`   Pending: ${status.pendingMigrations.length}`);
          if (status.pendingMigrations.length > 0) {
            console.log(
              `   Pending files: ${status.pendingMigrations.join(", ")}`
            );
          }
          if (status.lastMigration) {
            console.log(
              `   Last applied: ${status.lastMigration.migration_name} at ${status.lastMigration.applied_at}`
            );
          }
        })
        .catch(console.error);
      break;

    case "reset":
      console.log('⚠️ This will reset all migrations. Type "yes" to confirm:');
      process.stdin.once("data", (data) => {
        if (data.toString().trim() === "yes") {
          migrationRunner.reset().catch(console.error);
        } else {
          console.log("❌ Reset cancelled");
        }
        process.exit();
      });
      break;

    default:
      console.log("Usage: bun migrate.ts [migrate|status|reset]");
      console.log("  migrate (default) - Run pending migrations");
      console.log("  status           - Show migration status");
      console.log("  reset            - Reset all migrations (DANGEROUS)");
  }
}
