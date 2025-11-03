import type { QueryResultRow } from "pg";
import { pool } from "../db";
import { resolveRack, resolveFarm, ensurePlantLocation } from "./location-service";
import type { Queryable } from "./location-service";
import { resolveSpecies } from "./species-service";

export type PlantRecord = {
  id: string;
  display_name: string | null;
  status: string;
  planted_on: string;
  harvested_on: string | null;
  notes: string | null;
  species_id: string;
  species_name: string;
  species_scientific_name: string | null;
  plant_location_id: string;
  row: number;
  column: number;
  rack_id: string;
  rack_number: number;
  farm_id: string;
  farm_name: string;
  created_at: string;
  updated_at: string;
  sensor_count: number;
  actuator_count: number;
};

export type PlantFilters = {
  farm_id?: string;
  rack_id?: string;
  species_id?: string;
  status?: string;
};

export type CreatePlantInput = {
  rack_id: string;
  row: number;
  column: number;
  species_id: string;
  display_name?: string | null;
  status?: string | null;
  planted_on?: Date | null;
  notes?: string | null;
};

export type UpdatePlantInput = {
  display_name?: string | null;
  status?: string | null;
  planted_on?: Date | null;
  harvested_on?: Date | null;
  notes?: string | null;
};

type PlantRow = PlantRecord & QueryResultRow;

type PlantMinimal = {
  id: string;
  plant_location_id: string;
  status: string;
  planted_on: string;
  harvested_on: string | null;
};

const INACTIVE_PLANT_STATUSES = new Set(["harvested", "failed", "removed"]);

function isActiveStatus(status: string | null | undefined): boolean {
  if (!status) {
    return true;
  }

  return !INACTIVE_PLANT_STATUSES.has(status.toLowerCase());
}

function normalizeStatus(status?: string | null): string {
  return status?.toLowerCase() ?? "growing";
}

function mapPlant(row: PlantRow): PlantRecord {
  return {
    ...row,
    display_name: row.display_name,
    status: row.status,
    notes: row.notes,
    species_scientific_name: row.species_scientific_name
  };
}

function plantsBaseQuery(whereClause?: string): string {
  const filterClause = whereClause ? `WHERE ${whereClause}` : "";

  return `SELECT
      p.id,
      p.display_name,
      p.status,
      p.planted_on::text AS planted_on,
      p.harvested_on::text AS harvested_on,
      p.notes,
      p.species_id,
      sp.species_name,
      sp.scientific_name AS species_scientific_name,
      p.plant_location_id,
      pl.row,
      pl.column,
      p.created_at,
      p.updated_at,
      COALESCE(sensor_counts.count, 0) AS sensor_count,
      COALESCE(actuator_counts.count, 0) AS actuator_count,
      r.id::text AS rack_id,
      r.rack_number,
      f.id::text AS farm_id,
      f.farm_name
    FROM plants p
    JOIN species sp ON sp.id = p.species_id
    JOIN plant_locations pl ON pl.id = p.plant_location_id
    JOIN racks r ON r.id = pl.rack_id
    JOIN farms f ON f.id = r.farm_id
    LEFT JOIN LATERAL (
      SELECT COUNT(*)
      FROM sensors s
      WHERE s.plant_location_id = pl.id
    ) AS sensor_counts(count) ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)
      FROM actuators a
      WHERE a.plant_location_id = pl.id
    ) AS actuator_counts(count) ON TRUE
    ${filterClause}
    ORDER BY p.created_at DESC`;
}

async function fetchMinimalPlant(identifier: string, client: Queryable = pool): Promise<PlantMinimal> {
  const result = await client.query<PlantMinimal & QueryResultRow>(
    `SELECT id, plant_location_id, status, planted_on::text AS planted_on, harvested_on::text AS harvested_on
     FROM plants
     WHERE id::text = $1
     LIMIT 1`,
    [identifier]
  );

  if (result.rows.length === 0) {
    throw new Error(`Plant not found for id ${identifier}`);
  }

  return result.rows[0];
}

export async function listPlants(filters: PlantFilters = {}): Promise<PlantRecord[]> {
  const conditions: string[] = [];
  const parameters: unknown[] = [];

  if (filters.farm_id) {
  const farm = await resolveFarm(pool, filters.farm_id);
    parameters.push(farm.id);
    conditions.push(`f.id = $${parameters.length}`);
  }

  if (filters.rack_id) {
    const rack = await resolveRack(pool, filters.rack_id);
    parameters.push(rack.id);
    conditions.push(`r.id = $${parameters.length}`);
  }

  if (filters.species_id) {
    const species = await resolveSpecies(pool, filters.species_id);
    parameters.push(species.id);
    conditions.push(`sp.id = $${parameters.length}`);
  }

  if (filters.status) {
    parameters.push(filters.status.toLowerCase());
    conditions.push(`LOWER(p.status) = $${parameters.length}`);
  }

  const query = plantsBaseQuery(conditions.join(" AND "));

  const result = await pool.query<PlantRow>(query, parameters);
  return result.rows.map(mapPlant);
}

export async function getPlant(identifier: string): Promise<PlantRecord | null> {
  const result = await pool.query<PlantRow>(
    `${plantsBaseQuery("p.id::text = $1")} LIMIT 1`,
    [identifier]
  );

  return result.rows.length > 0 ? mapPlant(result.rows[0]) : null;
}

export async function createPlant(input: CreatePlantInput): Promise<PlantRecord> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const rack = await resolveRack(client, input.rack_id);
    const plantLocation = await ensurePlantLocation(client, rack.id, input.row, input.column);
    const species = await resolveSpecies(client, input.species_id);

    const existingLocation = await client.query<{ status: string } & QueryResultRow>(
      `SELECT status
       FROM plants
       WHERE plant_location_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [plantLocation.id]
    );

    if (existingLocation.rows.length > 0 && isActiveStatus(existingLocation.rows[0].status)) {
      throw new Error("Plant location is currently occupied");
    }

    const status = normalizeStatus(input.status);
    const plantedOn = input.planted_on ?? new Date();
    const displayName = input.display_name ?? species.species_name;

    const insertResult = await client.query<{ id: string } & QueryResultRow>(
      `INSERT INTO plants (
         plant_location_id,
         species_id,
         display_name,
         status,
         planted_on,
         notes
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        plantLocation.id,
        species.id,
        displayName,
        status,
        plantedOn.toISOString().substring(0, 10),
        input.notes ?? null
      ]
    );

    await client.query(
      `UPDATE plant_locations
       SET is_occupied = $2, updated_at = NOW()
       WHERE id = $1`,
      [plantLocation.id, isActiveStatus(status)]
    );

    await client.query("COMMIT");

    const created = await getPlant(insertResult.rows[0].id);
    if (!created) {
      throw new Error("Failed to load plant after creation");
    }

    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updatePlant(identifier: string, input: UpdatePlantInput): Promise<PlantRecord> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

  const existing = await fetchMinimalPlant(identifier, client);
    const status = normalizeStatus(input.status ?? existing.status);
    const plantedOn = input.planted_on ?? new Date(existing.planted_on);

    let harvestedOn: Date | null = null;
    if (input.harvested_on) {
      harvestedOn = input.harvested_on;
    } else if (!isActiveStatus(status) && !existing.harvested_on) {
      harvestedOn = new Date();
    } else if (existing.harvested_on) {
      harvestedOn = new Date(existing.harvested_on);
    }

    await client.query(
      `UPDATE plants
       SET
         display_name = COALESCE($2, display_name),
         status = $3,
         planted_on = $4,
         harvested_on = $5,
         notes = COALESCE($6, notes),
         updated_at = NOW()
       WHERE id = $1`,
      [
        existing.id,
        input.display_name ?? null,
        status,
        plantedOn.toISOString().substring(0, 10),
        harvestedOn ? harvestedOn.toISOString().substring(0, 10) : null,
        input.notes ?? null
      ]
    );

    await client.query(
      `UPDATE plant_locations
       SET is_occupied = $2, updated_at = NOW()
       WHERE id = $1`,
      [existing.plant_location_id, isActiveStatus(status)]
    );

    await client.query("COMMIT");

    const updated = await getPlant(existing.id);
    if (!updated) {
      throw new Error("Failed to load plant after update");
    }

    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deletePlant(identifier: string): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await fetchMinimalPlant(identifier, client);

    await client.query(`DELETE FROM plants WHERE id = $1`, [existing.id]);

    await client.query(
      `UPDATE plant_locations
       SET is_occupied = FALSE, updated_at = NOW()
       WHERE id = $1`,
      [existing.plant_location_id]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
