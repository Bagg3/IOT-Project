import { pool } from "../db";

export type RackRecord = {
  id: string;
  farm_id: string;
  rack_number: number;
  rows: number;
  columns: number;
};

export async function getRacks(): Promise<RackRecord[]> {
  const result = await pool.query<RackRecord>(
    `SELECT id, farm_id, rack_number, rows, columns
     FROM racks
     ORDER BY rack_number`
  );

  return result.rows;
}
