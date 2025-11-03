import type { QueryResultRow } from "pg";
import { pool } from "../db";
import {
  resolveFarmByIdentifier,
  resolveRack,
  withClient
} from "./location-service";

export type RackSummary = {
  id: string;
  rack_identifier: string | null;
  rack_name: string | null;
  rack_number: number;
  farm_id: string;
  farm_identifier: string | null;
  rows: number;
  columns: number;
  max_rows: number;
  max_columns: number;
  created_at: string;
  updated_at: string;
  plant_location_count: number;
  active_plants: number;
  sensor_count: number;
  actuator_count: number;
};

export type CreateRackInput = {
  farm_id: string;
  rack_number?: number | null;
  rack_name?: string | null;
  rows?: number;
  columns?: number;
  max_rows?: number | null;
  max_columns?: number | null;
};

export type UpdateRackInput = Partial<CreateRackInput>;

async function ensurePlantLocationGrid(
  rackId: string,
  rows: number,
  columns: number
): Promise<void> {
  await pool.query(
    `INSERT INTO plant_locations (rack_id, "row", "column")
     SELECT $1, row_series, col_series
     FROM generate_series(1, $2) AS row_series
     CROSS JOIN generate_series(1, $3) AS col_series
     ON CONFLICT (rack_id, "row", "column") DO NOTHING`,
    [rackId, rows, columns]
  );
}

function mapRack(row: RackSummary & QueryResultRow): RackSummary {
  return {
    ...row,
    rack_identifier: row.rack_identifier,
    rack_name: row.rack_name
  };
}

function rackQuery(): string {
  return `SELECT
      r.id,
      r.rack_identifier,
      r.rack_name,
      r.rack_number,
      r.farm_id,
      f.farm_identifier,
      r.rows,
      r.columns,
      COALESCE(r.max_rows, r.rows) AS max_rows,
      COALESCE(r.max_columns, r.columns) AS max_columns,
      r.created_at,
      r.updated_at,
      COALESCE(locations.count, 0) AS plant_location_count,
      COALESCE(plants.count, 0) AS active_plants,
      COALESCE(sensors.count, 0) AS sensor_count,
      COALESCE(actuators.count, 0) AS actuator_count
    FROM racks r
    JOIN farms f ON f.id = r.farm_id
    LEFT JOIN LATERAL (
      SELECT COUNT(*)
      FROM plant_locations pl
      WHERE pl.rack_id = r.id
    ) AS locations(count) ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)
      FROM plants p
      JOIN plant_locations pl ON pl.id = p.plant_location_id
      WHERE pl.rack_id = r.id
        AND p.status NOT IN ('harvested', 'failed', 'removed')
    ) AS plants(count) ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)
      FROM sensors s
      JOIN plant_locations pl ON pl.id = s.plant_location_id
      WHERE pl.rack_id = r.id
    ) AS sensors(count) ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)
      FROM actuators a
      JOIN plant_locations pl ON pl.id = a.plant_location_id
      WHERE pl.rack_id = r.id
    ) AS actuators(count) ON TRUE`;
}

export async function listRacksByFarm(farmIdentifier: string): Promise<RackSummary[]> {
  const farm = await withClient(async (client) => resolveFarmByIdentifier(client, farmIdentifier));

  const result = await pool.query<RackSummary & QueryResultRow>(
    `${rackQuery()} WHERE r.farm_id = $1 ORDER BY r.rack_number`,
    [farm.id]
  );

  return result.rows.map(mapRack);
}

export async function listRacks(): Promise<RackSummary[]> {
  const result = await pool.query<RackSummary & QueryResultRow>(
    `${rackQuery()} ORDER BY f.farm_name, r.rack_number`
  );

  return result.rows.map(mapRack);
}

export async function getRack(identifier: string): Promise<RackSummary | null> {
  try {
    const rack = await resolveRack(pool, identifier);
    const result = await pool.query<RackSummary & QueryResultRow>(
      `${rackQuery()} WHERE r.id = $1 LIMIT 1`,
      [rack.id]
    );

    return result.rows.length > 0 ? mapRack(result.rows[0]) : null;
  } catch {
    return null;
  }
}

export async function createRack(input: CreateRackInput): Promise<RackSummary> {
  const farm = await withClient(async (client) => resolveFarmByIdentifier(client, input.farm_id));

  const nextRackNumberResult = await pool.query<{ next_number: number } & QueryResultRow>(
    `SELECT COALESCE(MAX(rack_number), 0) + 1 AS next_number
     FROM racks
     WHERE farm_id = $1`,
    [farm.id]
  );

  const rackNumber = input.rack_number ?? nextRackNumberResult.rows[0].next_number;
  const rows = input.rows ?? 5;
  const columns = input.columns ?? 5;

  const insertResult = await pool.query<{ id: string } & QueryResultRow>(
    `INSERT INTO racks (farm_id, rack_number, rack_name, rows, columns, max_rows, max_columns)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      farm.id,
      rackNumber,
      input.rack_name ?? `Rack ${rackNumber}`,
      rows,
      columns,
      input.max_rows ?? rows,
      input.max_columns ?? columns
    ]
  );

  await ensurePlantLocationGrid(insertResult.rows[0].id, rows, columns);

  const rack = await getRack(insertResult.rows[0].id);
  if (!rack) {
    throw new Error("Failed to load rack after creation");
  }

  return rack;
}

export async function updateRack(identifier: string, input: UpdateRackInput): Promise<RackSummary> {
  const rack = await resolveRack(pool, identifier);

  const nextRows = input.max_rows ?? input.rows ?? rack.max_rows ?? 5;
  const nextColumns = input.max_columns ?? input.columns ?? rack.max_columns ?? 5;

  await pool.query(
    `UPDATE racks
     SET
       rack_number = COALESCE($2, rack_number),
       rack_name = COALESCE($3, rack_name),
       rows = COALESCE($4, rows),
       columns = COALESCE($5, columns),
       max_rows = COALESCE($6, max_rows),
       max_columns = COALESCE($7, max_columns),
       updated_at = NOW()
     WHERE id = $1`,
    [
      rack.id,
      input.rack_number ?? null,
      input.rack_name ?? null,
      input.rows ?? null,
      input.columns ?? null,
      input.max_rows ?? null,
      input.max_columns ?? null
    ]
  );

  await ensurePlantLocationGrid(rack.id, nextRows, nextColumns);

  const updated = await getRack(rack.id);
  if (!updated) {
    throw new Error("Failed to load rack after update");
  }

  return updated;
}

export async function deleteRack(identifier: string): Promise<void> {
  const rack = await resolveRack(pool, identifier);
  await pool.query(`DELETE FROM racks WHERE id = $1`, [rack.id]);
}
