import path from "node:path";
import { mkdirSync } from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dbUrl =
  process.env.DATABASE_URL?.replace("file:", "") ?? "./data/analytics.db";

const dbDir = path.dirname(
  path.resolve(/*turbopackIgnore: true*/ dbUrl),
);
mkdirSync(dbDir, { recursive: true });

const globalForDb = globalThis as unknown as {
  sqliteConnection?: Database.Database;
};

function createConnection(): Database.Database {
  return new Database(dbUrl, { fileMustExist: false });
}

const connection =
  globalForDb.sqliteConnection ??
  (globalForDb.sqliteConnection = createConnection());

connection.pragma("journal_mode = WAL");
connection.pragma("foreign_keys = ON");

export const db = drizzle(connection, { schema });
export { connection as sqlite };
