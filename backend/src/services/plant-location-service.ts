import type { QueryResultRow } from "pg";
import { pool } from "../db";
import { resolveRack } from "./location-service";

export type PlantLocationSummary = {
  id: string;
  rack_id: string;
  rack_identifier: string;
  rack_number: number;
  row: number;
  column: number;
  is_occupied: boolean;
  plant_id: string | null;
  plant_identifier: string | null;
  plant_display_name: string | null;
  plant_status: string | null;
  species_id: string | null;
  species_name: string | null;
  updated_at: string;
};

type PlantLocationRow = PlantLocationSummary & QueryResultRow;

function mapLocation(row: PlantLocationRow): PlantLocationSummary {
  return {
    ...row,
    plant_display_name: row.plant_display_name,
    plant_status: row.plant_status,
    species_name: row.species_name
  };
}

export async function listPlantLocationsByRack(rackIdentifier: string): Promise<PlantLocationSummary[]> {
  const rack = await resolveRack(pool, rackIdentifier);

  const result = await pool.query<PlantLocationRow>(
    `SELECT
       pl.id,
       r.id::text AS rack_id,
       COALESCE(r.rack_identifier, r.id::text) AS rack_identifier,
       r.rack_number,
       pl.row,
       pl.column,
       pl.is_occupied,
       pl.updated_at,
       p.id AS plant_id,
       p.plant_identifier,
       p.display_name AS plant_display_name,
       p.status AS plant_status,
       sp.id AS species_id,
       sp.species_name
     FROM plant_locations pl
     JOIN racks r ON r.id = pl.rack_id
     LEFT JOIN LATERAL (
       SELECT p_inner.*
       FROM plants p_inner
       WHERE p_inner.plant_location_id = pl.id
       ORDER BY p_inner.created_at DESC
       LIMIT 1
     ) p ON TRUE
     LEFT JOIN species sp ON sp.id = p.species_id
     WHERE pl.rack_id = $1
     ORDER BY pl.row, pl.column`,
    [rack.id]
  );

  return result.rows.map(mapLocation);
}
