import { Pool } from "pg";
import { env } from "./config/env";

export const pool = new Pool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  database: env.DATABASE_NAME,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30_000
});

pool.on("error", (error: Error) => {
  console.error("Unexpected database error", error);
});

export async function withConnection<T>(handler: (client: Pool) => Promise<T>): Promise<T> {
  return handler(pool);
}
