import { database } from "./database";
import { latestMigrationId, migrations } from "./migrations/index.mjs";

let schemaReady: Promise<void> | null = null;

async function applyPendingMigrations() {
  await database.prepare(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY NOT NULL,
    applied_at TEXT NOT NULL
  )`).run();

  const result = await database.prepare("SELECT id FROM schema_migrations").all();
  const applied = new Set(result.results.map((row) => String(row.id)));

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      continue;
    }

    await database.batch([
      ...migration.statements.map((statement) => database.prepare(statement)),
      database
        .prepare(
          "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
        )
        .bind(migration.id, new Date().toISOString()),
    ]);
  }

  const latest = await database
    .prepare("SELECT id FROM schema_migrations WHERE id = ?")
    .bind(latestMigrationId)
    .first();
  if (!latest) {
    throw new Error(`Database migration ${latestMigrationId} was not applied.`);
  }
}

export function ensureSchema() {
  schemaReady ??= applyPendingMigrations().catch((error: unknown) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}
