import * as initialMigration from "./0001_initial.mjs";

const registeredMigrations = [initialMigration];
const migrationIdPattern = /^\d{4}_[a-z0-9_-]+$/;
const seenIds = new Set();

for (const migration of registeredMigrations) {
  if (!migrationIdPattern.test(migration.id) || seenIds.has(migration.id)) {
    throw new Error(`Invalid or duplicate migration id: ${migration.id}`);
  }
  if (
    !Array.isArray(migration.statements) ||
    migration.statements.length === 0 ||
    migration.statements.some(
      (statement) => typeof statement !== "string" || !statement.trim(),
    )
  ) {
    throw new Error(`Migration ${migration.id} has invalid statements.`);
  }
  seenIds.add(migration.id);
}

const sortedIds = [...seenIds].sort();
if (
  registeredMigrations.some(
    (migration, index) => migration.id !== sortedIds[index],
  )
) {
  throw new Error("Database migrations must be registered in ascending order.");
}

// Runtime migrations may race across serverless cold starts, so every migration
// must contain replay-safe SQL and be registered here before application code uses it.
export const migrations = Object.freeze(registeredMigrations);
export const latestMigrationId = migrations.at(-1).id;
