import logger from "../logger";
import { Database } from "@/lib/types/db";
import { Kysely, KyselyConfig, LogEvent, PostgresDialect } from "kysely";
import pg from "pg";

import "dotenv/config";

// To keep numeric typing consistent, pass the CLI flag `--numeric-parser number` to kysely-codegen.
const PG_COUNT_OID = 20;
pg.types.setTypeParser(PG_COUNT_OID, (str) => parseInt(str, 10));
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (str) => parseFloat(str));

class DatabaseClient extends Kysely<Database> {
  private static postgresConfig: pg.ClientConfig = {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT!),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  };

  private static kyselyConfig: KyselyConfig = {
    dialect: new PostgresDialect({
      pool: new pg.Pool(this.postgresConfig),
    }),
    log: (event: LogEvent) => {
      // Level `verbose` gets very noisy. Please leave on `debug`.
      logger.debug(
        `query: ${event.query.sql.replace(/\s+/g, " ")} <- ${JSON.stringify(event.query.parameters)}`,
      );
    },
  };

  constructor() {
    super(DatabaseClient.kyselyConfig);
  }

  /*
   * Creates a new database connection with the given config.
   */
  public async sidechannel<T>(
    config: Partial<pg.ClientConfig>,
    callback: (db: Kysely<Database>) => Promise<T>,
  ): Promise<T> {
    const pool = new pg.Pool({ ...DatabaseClient.postgresConfig, ...config });
    const db = new Kysely<Database>({
      ...DatabaseClient.kyselyConfig,
      dialect: new PostgresDialect({ pool }),
    });
    try {
      const result = await callback(db);
      return result;
    } finally {
      await db.destroy();
    }
  }
}

export const db = new DatabaseClient();
