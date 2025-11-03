import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(currentDir, "../../migrations/schema.sql");

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    const sql = await readFile(schemaPath, "utf8");
    await client.query(sql);
    console.log("✅ Database schema ensured");
  } catch (error) {
    console.error("❌ Failed to run migrations", error);
    throw error;
  } finally {
    client.release();
  }
}
