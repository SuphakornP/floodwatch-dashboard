import { mkdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type {
  Client,
  Config,
  InStatement,
  InValue,
  ResultSet,
} from "@libsql/client";

type SqlRow = Record<string, unknown>;
type ParameterizedStatement = { sql: string; args: InValue[] };

const globalDatabase = globalThis as typeof globalThis & {
  floodwatchLibsqlClient?: Promise<Client>;
};

function databaseConfiguration(): { config: Config; local: boolean } {
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
    return {
      config: { url, authToken: authToken || undefined, intMode: "number" },
      local,
    };
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
    config: {
      url: pathToFileURL(databasePath).href,
      intMode: "number",
      timeout: 5_000,
    },
    local: true,
  };
}

async function createDatabaseClient() {
  const { config, local } = databaseConfiguration();
  if (local) {
    const { createClient } = await import("@libsql/client");
    return createClient(config);
  }

  // The web client uses HTTP and avoids native database bindings in Vercel Functions.
  const { createClient } = await import("@libsql/client/web");
  return createClient(config);
}

function getDatabase(): Promise<Client> {
  if (!globalDatabase.floodwatchLibsqlClient) {
    const clientPromise = createDatabaseClient().catch((error: unknown) => {
      if (globalDatabase.floodwatchLibsqlClient === clientPromise) {
        delete globalDatabase.floodwatchLibsqlClient;
      }
      throw error;
    });
    globalDatabase.floodwatchLibsqlClient = clientPromise;
  }
  return globalDatabase.floodwatchLibsqlClient;
}

function rowsFrom(result: ResultSet): SqlRow[] {
  return result.rows.map((row) =>
    Object.fromEntries(
      result.columns.map((column, index) => [column, row[index]]),
    ),
  );
}

class BoundStatement {
  private readonly sql: string;
  private values: InValue[] = [];

  constructor(sql: string) {
    this.sql = sql;
  }

  bind(...values: InValue[]): this {
    this.values = values;
    return this;
  }

  toStatement(): ParameterizedStatement {
    return { sql: this.sql, args: this.values };
  }

  async run() {
    const result = await (await getDatabase()).execute(this.toStatement());
    return { meta: { changes: result.rowsAffected } };
  }

  async all() {
    const result = await (await getDatabase()).execute(this.toStatement());
    return { results: rowsFrom(result) };
  }

  async first() {
    const result = await (await getDatabase()).execute(this.toStatement());
    return rowsFrom(result)[0] ?? null;
  }
}

export const database = {
  prepare(sql: string) {
    return new BoundStatement(sql);
  },

  async batch(statements: readonly BoundStatement[]) {
    const results = await (await getDatabase()).batch(
      statements.map((statement): InStatement => statement.toStatement()),
      "write",
    );
    return results.map((result) => ({
      meta: { changes: result.rowsAffected },
    }));
  },
};

export async function checkDatabaseConnection() {
  const result = await (await getDatabase()).execute("SELECT 1 AS ok");
  return result.rows[0]?.ok === 1;
}
