import type { QueryResultRow } from "pg";
import { pool } from "../db";
import type { Queryable } from "./location-service";

export type SpeciesRecord = {
  id: string;
  species_name: string;
  scientific_name: string | null;
  optimal_moisture_min: number | null;
  optimal_moisture_max: number | null;
  optimal_temperature_min: number | null;
  optimal_temperature_max: number | null;
  optimal_light_intensity_min: number | null;
  optimal_light_intensity_max: number | null;
  optimal_color_index: number | null;
  growth_duration_days: number | null;
  created_at: string;
  updated_at: string;
  active_plants: number;
};

export type CreateSpeciesInput = {
  species_name: string;
  scientific_name?: string | null;
  optimal_moisture_min?: number | null;
  optimal_moisture_max?: number | null;
  optimal_temperature_min?: number | null;
  optimal_temperature_max?: number | null;
  optimal_light_intensity_min?: number | null;
  optimal_light_intensity_max?: number | null;
  optimal_color_index?: number | null;
  growth_duration_days?: number | null;
};

export type UpdateSpeciesInput = Partial<CreateSpeciesInput>;

type SpeciesRow = SpeciesRecord & QueryResultRow;

function mapSpecies(row: SpeciesRow): SpeciesRecord {
  return {
    ...row,
    scientific_name: row.scientific_name,
    optimal_moisture_min: row.optimal_moisture_min,
    optimal_moisture_max: row.optimal_moisture_max,
    optimal_temperature_min: row.optimal_temperature_min,
    optimal_temperature_max: row.optimal_temperature_max,
    optimal_light_intensity_min: row.optimal_light_intensity_min,
    optimal_light_intensity_max: row.optimal_light_intensity_max,
    optimal_color_index: row.optimal_color_index,
    growth_duration_days: row.growth_duration_days
  };
}

export async function listSpecies(): Promise<SpeciesRecord[]> {
  const result = await pool.query<SpeciesRow>(
    `SELECT
       sp.id,
       sp.species_name,
       sp.scientific_name,
       sp.optimal_moisture_min,
       sp.optimal_moisture_max,
       sp.optimal_temperature_min,
       sp.optimal_temperature_max,
       sp.optimal_light_intensity_min,
       sp.optimal_light_intensity_max,
       sp.optimal_color_index,
       sp.growth_duration_days,
       sp.created_at,
       sp.updated_at,
       COALESCE(active.count, 0) AS active_plants
     FROM species sp
     LEFT JOIN LATERAL (
       SELECT COUNT(*)
       FROM plants p
       WHERE p.species_id = sp.id
         AND p.status NOT IN ('harvested', 'failed', 'removed')
     ) AS active(count) ON TRUE
     ORDER BY sp.species_name`
  );

  return result.rows.map(mapSpecies);
}

export async function resolveSpecies(
  client: Queryable,
  speciesIdOrName: string
): Promise<SpeciesRecord> {
  const result = await client.query<SpeciesRow>(
   `SELECT
     sp.id,
       sp.species_name,
       sp.scientific_name,
       sp.optimal_moisture_min,
       sp.optimal_moisture_max,
       sp.optimal_temperature_min,
       sp.optimal_temperature_max,
       sp.optimal_light_intensity_min,
       sp.optimal_light_intensity_max,
       sp.optimal_color_index,
       sp.growth_duration_days,
       sp.created_at,
       sp.updated_at,
       COALESCE(active.count, 0) AS active_plants
     FROM species sp
     LEFT JOIN LATERAL (
       SELECT COUNT(*)
       FROM plants p
       WHERE p.species_id = sp.id
         AND p.status NOT IN ('harvested', 'failed', 'removed')
     ) AS active(count) ON TRUE
     WHERE sp.id::text = $1 OR LOWER(sp.species_name) = LOWER($1)
     LIMIT 1`,
    [speciesIdOrName]
  );

  if (result.rowCount === 0) {
    throw new Error(`Species not found for id or name ${speciesIdOrName}`);
  }

  return mapSpecies(result.rows[0]);
}

export async function getSpecies(identifier: string): Promise<SpeciesRecord | null> {
  try {
    return await resolveSpecies(pool, identifier);
  } catch {
    return null;
  }
}

export async function createSpecies(input: CreateSpeciesInput): Promise<SpeciesRecord> {
  const insertResult = await pool.query<{ id: string } & QueryResultRow>(
    `INSERT INTO species (
       species_name,
       scientific_name,
       optimal_moisture_min,
       optimal_moisture_max,
       optimal_temperature_min,
       optimal_temperature_max,
       optimal_light_intensity_min,
       optimal_light_intensity_max,
       optimal_color_index,
       growth_duration_days
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      input.species_name,
      input.scientific_name ?? null,
      input.optimal_moisture_min ?? null,
      input.optimal_moisture_max ?? null,
      input.optimal_temperature_min ?? null,
      input.optimal_temperature_max ?? null,
      input.optimal_light_intensity_min ?? null,
      input.optimal_light_intensity_max ?? null,
      input.optimal_color_index ?? null,
      input.growth_duration_days ?? null
    ]
  );

  return resolveSpecies(pool, insertResult.rows[0].id);
}

export async function updateSpecies(
  identifier: string,
  input: UpdateSpeciesInput
): Promise<SpeciesRecord> {
  const existing = await resolveSpecies(pool, identifier);

  const updateResult = await pool.query<{ id: string } & QueryResultRow>(
    `UPDATE species
     SET
       species_name = COALESCE($2, species_name),
       scientific_name = COALESCE($3, scientific_name),
       optimal_moisture_min = COALESCE($4, optimal_moisture_min),
       optimal_moisture_max = COALESCE($5, optimal_moisture_max),
       optimal_temperature_min = COALESCE($6, optimal_temperature_min),
       optimal_temperature_max = COALESCE($7, optimal_temperature_max),
       optimal_light_intensity_min = COALESCE($8, optimal_light_intensity_min),
       optimal_light_intensity_max = COALESCE($9, optimal_light_intensity_max),
       optimal_color_index = COALESCE($10, optimal_color_index),
       growth_duration_days = COALESCE($11, growth_duration_days),
       updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [
      existing.id,
      input.species_name ?? null,
      input.scientific_name ?? null,
      input.optimal_moisture_min ?? null,
      input.optimal_moisture_max ?? null,
      input.optimal_temperature_min ?? null,
      input.optimal_temperature_max ?? null,
      input.optimal_light_intensity_min ?? null,
      input.optimal_light_intensity_max ?? null,
      input.optimal_color_index ?? null,
      input.growth_duration_days ?? null
    ]
  );

  return resolveSpecies(pool, updateResult.rows[0].id);
}

export async function deleteSpecies(identifier: string): Promise<void> {
  const species = await resolveSpecies(pool, identifier);

  const usage = await pool.query<{ count: string } & QueryResultRow>(
    `SELECT COUNT(*)::text AS count
     FROM plants
     WHERE species_id = $1`,
    [species.id]
  );

  if (Number.parseInt(usage.rows[0].count, 10) > 0) {
    throw new Error("Unable to delete species while plants are assigned. Remove plants first.");
  }

  await pool.query(`DELETE FROM species WHERE id = $1`, [species.id]);
}
