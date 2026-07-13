import { mkdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";
import { migrations } from "../db/migrations/index.mjs";

function databaseConfiguration() {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  const requiresRemoteDatabase =
    process.env.NODE_ENV === "production" ||
    process.env.REQUIRE_TURSO === "true" ||
    Boolean(process.env.VERCEL);

  if (url) {
    const local = url.startsWith("file:");
    if (requiresRemoteDatabase && local) {
      throw new Error(
        "TURSO_DATABASE_URL must use a remote Turso URL in production.",
      );
    }
    if (!local && !authToken) {
      throw new Error(
        "TURSO_AUTH_TOKEN is required for the configured Turso database.",
      );
    }
    return { url, authToken: authToken || undefined, intMode: "number" };
  }

  if (authToken) {
    throw new Error(
      "TURSO_DATABASE_URL is required when TURSO_AUTH_TOKEN is set.",
    );
  }
  if (requiresRemoteDatabase) {
    throw new Error(
      "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required in production.",
    );
  }

  const databaseFilename =
    process.env.DATABASE_FILENAME?.trim() || "floodwatch.sqlite";
  if (basename(databaseFilename) !== databaseFilename) {
    throw new Error("DATABASE_FILENAME must be a file name without directories.");
  }
  const databasePath = resolve(process.cwd(), "data", databaseFilename);
  mkdirSync(dirname(databasePath), { recursive: true });
  return {
    url: pathToFileURL(databasePath).href,
    intMode: "number",
    timeout: 5_000,
  };
}

const client = createClient(databaseConfiguration());

try {
  await client.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY NOT NULL,
    applied_at TEXT NOT NULL
  )`);
  const appliedResult = await client.execute("SELECT id FROM schema_migrations");
  const applied = new Set(appliedResult.rows.map((row) => String(row.id)));

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      console.log(`Already applied ${migration.id}`);
      continue;
    }

    await client.batch(
      [
        ...migration.statements.map((sql) => ({ sql, args: [] })),
        {
          sql: "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
          args: [migration.id, new Date().toISOString()],
        },
      ],
      "write",
    );
    console.log(`Applied ${migration.id}`);
  }

  const verifiedResult = await client.execute("SELECT id FROM schema_migrations");
  const verified = new Set(verifiedResult.rows.map((row) => String(row.id)));
  const missing = migrations.find((migration) => !verified.has(migration.id));
  if (missing) {
    throw new Error(`Database migration ${missing.id} was not applied.`);
  }
} finally {
  client.close();
}
