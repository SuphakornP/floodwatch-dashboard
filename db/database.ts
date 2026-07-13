import { mkdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

type SqlValue = string | number | bigint | Uint8Array | null;
type SqlRow = Record<string, unknown>;

const globalDatabase = globalThis as typeof globalThis & {
  floodwatchDatabase?: DatabaseSync;
};

function getDatabase(): DatabaseSync {
  if (globalDatabase.floodwatchDatabase) {
    return globalDatabase.floodwatchDatabase;
  }

  const databaseFilename =
    process.env.DATABASE_FILENAME?.trim() || "floodwatch.sqlite";
  if (basename(databaseFilename) !== databaseFilename) {
    throw new Error("DATABASE_FILENAME must be a file name without directories.");
  }

  const databasePath = resolve(process.cwd(), "data", databaseFilename);
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  globalDatabase.floodwatchDatabase = database;
  return database;
}

class BoundStatement {
  private readonly sql: string;
  private values: SqlValue[] = [];

  constructor(sql: string) {
    this.sql = sql;
  }

  bind(...values: SqlValue[]): this {
    this.values = values;
    return this;
  }

  run() {
    const result = getDatabase().prepare(this.sql).run(...this.values);
    return { meta: { changes: Number(result.changes) } };
  }

  all() {
    return {
      results: getDatabase().prepare(this.sql).all(...this.values) as SqlRow[],
    };
  }

  first() {
    return (
      (getDatabase().prepare(this.sql).get(...this.values) as
        | SqlRow
        | undefined) ?? null
    );
  }
}

export const database = {
  prepare(sql: string) {
    return new BoundStatement(sql);
  },

  async batch(statements: readonly BoundStatement[]) {
    const database = getDatabase();
    database.exec("BEGIN");

    try {
      const results = statements.map((statement) => statement.run());
      database.exec("COMMIT");
      return results;
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  },
};
