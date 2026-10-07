import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

type Db = MySql2Database<typeof schema>;

const globalForDb = globalThis as unknown as {
  galaxyPool?: mysql.Pool;
  galaxyDb?: Db;
};

export function getDb(): Db {
  if (globalForDb.galaxyDb) return globalForDb.galaxyDb;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Brak DATABASE_URL w zmiennych środowiskowych.");
  }

  const pool =
    globalForDb.galaxyPool ??
    mysql.createPool({
      uri: databaseUrl,
      connectionLimit: 10,
      timezone: "Z",
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.galaxyPool = pool;
  }

  const db = drizzle(pool, { schema, mode: "default" });
  globalForDb.galaxyDb = db;
  return db;
}

/** @deprecated prefer getDb() */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
