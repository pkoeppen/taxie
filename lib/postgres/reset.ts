import { db } from ".";
import { loadSchema } from "./schema";
import logger from "../logger";
import { isMain } from "../util";
import { sql } from "kysely";

/**
 * Drops the main database.
 */
export async function dropDatabase() {
  await db.sidechannel({ database: "postgres" }, async (db) => {
    const database = process.env.POSTGRES_DB;
    const sqlString = `
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${database}' AND pid <> pg_backend_pid();
    `;
    logger.info(`Resetting database '${database}'`);
    await sql.raw(sqlString).execute(db);
    await sql.raw(`DROP DATABASE IF EXISTS ${database};`).execute(db);
    await sql.raw(`CREATE DATABASE ${database};`).execute(db);
  });
}

/**
 * Drops the main database and runs schema setup.
 */
export async function resetPostgres() {
  await dropDatabase();
  await loadSchema();
}

if (isMain(import.meta.url)) {
  await resetPostgres();
}
