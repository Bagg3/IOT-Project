import type { QueryResultRow } from "pg";
import { pool } from "../db";
import { resolveFarmByIdentifier, withClient } from "./location-service";

export type FarmRecord = {
  id: string;
  farm_identifier: string | null;
  farm_name: string;
  address: string | null;
  created_at: string;
  rack_count: number;
  plant_location_count: number;
  active_plants: number;
};

export type CreateFarmInput = {
  farm_name: string;
  address?: string | null;
  farm_identifier?: string | null;
};

export type UpdateFarmInput = Partial<CreateFarmInput>;

type FarmRow = FarmRecord & QueryResultRow;

function mapFarm(row: FarmRow): FarmRecord {
  return {
    ...row,
    farm_identifier: row.farm_identifier,
    address: row.address
  };
}

async function fetchFarmById(farmId: string): Promise<FarmRecord> {
  const result = await pool.query<FarmRow>(
    `SELECT
       f.id,
       f.farm_identifier,
       f.farm_name,
       f.address,
       f.created_at,
       COALESCE(rack_counts.count, 0) AS rack_count,
       COALESCE(location_counts.count, 0) AS plant_location_count,
       COALESCE(plant_counts.count, 0) AS active_plants
     FROM farms f
     LEFT JOIN LATERAL (
       SELECT COUNT(*)
       FROM racks r
       WHERE r.farm_id = f.id
     ) AS rack_counts(count) ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*)
       FROM plant_locations pl
       JOIN racks r ON r.id = pl.rack_id
       WHERE r.farm_id = f.id
     ) AS location_counts(count) ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*)
       FROM plants p
       JOIN plant_locations pl ON pl.id = p.plant_location_id
       JOIN racks r ON r.id = pl.rack_id
       WHERE r.farm_id = f.id
         AND p.status NOT IN ('harvested', 'failed', 'removed')
     ) AS plant_counts(count) ON TRUE
     WHERE f.id = $1
     LIMIT 1`,
    [farmId]
  );

  if (result.rowCount === 0) {
    throw new Error(`Farm not found for identifier ${farmId}`);
  }

  return mapFarm(result.rows[0]);
}

export async function listFarms(): Promise<FarmRecord[]> {
  const result = await pool.query<FarmRow>(
    `SELECT
       f.id,
       f.farm_identifier,
       f.farm_name,
       f.address,
       f.created_at,
       COALESCE(rack_counts.count, 0) AS rack_count,
       COALESCE(location_counts.count, 0) AS plant_location_count,
       COALESCE(plant_counts.count, 0) AS active_plants
     FROM farms f
     LEFT JOIN LATERAL (
       SELECT COUNT(*)
       FROM racks r
       WHERE r.farm_id = f.id
     ) AS rack_counts(count) ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*)
       FROM plant_locations pl
       JOIN racks r ON r.id = pl.rack_id
       WHERE r.farm_id = f.id
     ) AS location_counts(count) ON TRUE
     LEFT JOIN LATERAL (
       SELECT COUNT(*)
       FROM plants p
       JOIN plant_locations pl ON pl.id = p.plant_location_id
       JOIN racks r ON r.id = pl.rack_id
       WHERE r.farm_id = f.id
         AND p.status NOT IN ('harvested', 'failed', 'removed')
     ) AS plant_counts(count) ON TRUE
     ORDER BY f.farm_name`
  );

  return result.rows.map(mapFarm);
}

export async function getFarm(identifier: string): Promise<FarmRecord | null> {
  try {
    const resolved = await withClient(async (client) => resolveFarmByIdentifier(client, identifier));
    return await fetchFarmById(resolved.id);
  } catch {
    return null;
  }
}

export async function createFarm(input: CreateFarmInput): Promise<FarmRecord> {
  const insertResult = await pool.query<{ id: string } & QueryResultRow>(
    `INSERT INTO farms (farm_identifier, farm_name, address)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [input.farm_identifier ?? null, input.farm_name, input.address ?? null]
  );

  return fetchFarmById(insertResult.rows[0].id);
}

export async function updateFarm(identifier: string, input: UpdateFarmInput): Promise<FarmRecord> {
  const resolved = await withClient(async (client) => resolveFarmByIdentifier(client, identifier));

  const updateResult = await pool.query<{ id: string } & QueryResultRow>(
    `UPDATE farms
     SET
       farm_identifier = COALESCE($2, farm_identifier),
       farm_name = COALESCE($3, farm_name),
       address = COALESCE($4, address),
       created_at = created_at
     WHERE id = $1
     RETURNING id`,
    [resolved.id, input.farm_identifier ?? null, input.farm_name ?? null, input.address ?? null]
  );

  return fetchFarmById(updateResult.rows[0].id);
}

export async function deleteFarm(identifier: string): Promise<void> {
  const resolved = await withClient(async (client) => resolveFarmByIdentifier(client, identifier));

  await pool.query(`DELETE FROM farms WHERE id = $1`, [resolved.id]);
}
