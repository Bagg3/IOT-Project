import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db";
import { seedDatabase } from "./seed";

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

export async function runMigrationsAndSeed(): Promise<void> {
  const client = await pool.connect();
  try {
    // Run schema migration
    const sql = await readFile(schemaPath, "utf8");
    await client.query(sql);
    console.log("✅ Database schema ensured");
    
    // Run seed data
    await seedDatabase(client);
  } catch (error) {
    console.error("❌ Failed to run migrations and seed", error);
    throw error;
  } finally {
    client.release();
  }
}
