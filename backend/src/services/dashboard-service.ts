import { pool } from "../db";

export type RackRecord = {
  id: string;
  rack_identifier: string | null;
  rack_name: string | null;
  farm_id: string;
  farm_identifier: string | null;
  rack_number: number;
  rows: number;
  columns: number;
  max_rows: number;
  max_columns: number;
};

export async function getRacks(): Promise<RackRecord[]> {
  const result = await pool.query<RackRecord>(
    `SELECT
       r.id,
       r.rack_identifier,
       r.rack_name,
       r.farm_id,
       f.farm_identifier,
       r.rack_number,
       r.rows,
       r.columns,
       COALESCE(r.max_rows, r.rows) AS max_rows,
       COALESCE(r.max_columns, r.columns) AS max_columns
     FROM racks r
     JOIN farms f ON f.id = r.farm_id
     ORDER BY r.rack_number`
  );

  return result.rows;
}
