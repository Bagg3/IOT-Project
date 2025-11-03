import type { QueryResultRow } from "pg";
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

export type DashboardSensorSnapshot = {
  id?: string;
  sensor_type: string;
  recorded_at: string;
  value: Record<string, unknown>;
  reading_value: number | null;
  quality_flag: string | null;
};

export type DashboardPlantSnapshot = {
  id: string;
  identifier: string | null;
  display_name: string | null;
  status: string | null;
  planted_on: string | null;
  harvested_on: string | null;
  updated_at: string | null;
  species: {
    id: string | null;
    identifier: string | null;
    name: string | null;
    scientific_name: string | null;
  } | null;
};

export type DashboardCellSnapshot = {
  location_id: string;
  row: number;
  column: number;
  is_occupied: boolean;
  plant: DashboardPlantSnapshot | null;
  sensors: {
    light_sensor?: DashboardSensorSnapshot;
    moisture_sensor?: DashboardSensorSnapshot;
    color_camera?: DashboardSensorSnapshot;
  };
};

export type DashboardRackSnapshot = {
  id: string;
  rack_identifier: string;
  rack_name: string | null;
  rack_number: number;
  rows: number;
  columns: number;
  max_rows: number;
  max_columns: number;
  farm: {
    id: string;
    identifier: string;
    name: string | null;
  };
  cells: DashboardCellSnapshot[];
};

type DashboardRow = {
  rack_id: string;
  rack_identifier: string;
  rack_name: string | null;
  rack_number: number;
  rows: number;
  columns: number;
  max_rows: number;
  max_columns: number;
  farm_id: string;
  farm_identifier: string;
  farm_name: string | null;
  plant_location_id: string;
  row: number;
  column: number;
  is_occupied: boolean;
  plant_id: string | null;
  plant_identifier: string | null;
  plant_display_name: string | null;
  plant_status: string | null;
  planted_on: string | null;
  harvested_on: string | null;
  plant_updated_at: string | null;
  species_id: string | null;
  species_identifier: string | null;
  species_name: string | null;
  species_scientific_name: string | null;
  light_id: string | null;
  light_recorded_at: string | null;
  light_value: unknown;
  light_reading_value: number | null;
  light_quality_flag: string | null;
  moisture_id: string | null;
  moisture_recorded_at: string | null;
  moisture_value: unknown;
  moisture_reading_value: number | null;
  moisture_quality_flag: string | null;
  color_id: string | null;
  color_recorded_at: string | null;
  color_value: unknown;
  color_reading_value: number | null;
  color_quality_flag: string | null;
} & QueryResultRow;

function parseJsonValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return {};
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { value } as Record<string, unknown>;
    }
  }

  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return { value } as Record<string, unknown>;
}

function buildSensorSnapshot(
  recordedAt: string | null,
  value: unknown,
  readingValue: number | null,
  qualityFlag: string | null,
  id: string | null,
  sensorType: string
): DashboardSensorSnapshot | undefined {
  if (!recordedAt) {
    return undefined;
  }

  return {
    id: id ?? undefined,
    sensor_type: sensorType,
    recorded_at: recordedAt,
    value: parseJsonValue(value),
    reading_value: readingValue ?? null,
    quality_flag: qualityFlag ?? null
  };
}

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

export async function getDashboardSnapshot(): Promise<DashboardRackSnapshot[]> {
  const result = await pool.query<DashboardRow>(
    `SELECT
       r.id::text AS rack_id,
       COALESCE(r.rack_identifier, r.id::text) AS rack_identifier,
       r.rack_name,
       r.rack_number,
       r.rows,
       r.columns,
       COALESCE(r.max_rows, r.rows) AS max_rows,
       COALESCE(r.max_columns, r.columns) AS max_columns,
       f.id::text AS farm_id,
       COALESCE(f.farm_identifier, f.id::text) AS farm_identifier,
       f.farm_name,
       pl.id::text AS plant_location_id,
       pl.row,
       pl.column,
       pl.is_occupied,
       p.id::text AS plant_id,
       p.plant_identifier,
       p.display_name AS plant_display_name,
       p.status AS plant_status,
       p.planted_on::text AS planted_on,
       p.harvested_on::text AS harvested_on,
       p.updated_at::text AS plant_updated_at,
       sp.id::text AS species_id,
       sp.species_identifier,
       sp.species_name,
       sp.scientific_name AS species_scientific_name,
       light.id::text AS light_id,
       light.recorded_at::text AS light_recorded_at,
       light.value AS light_value,
       light.reading_value AS light_reading_value,
       light.quality_flag AS light_quality_flag,
       moisture.id::text AS moisture_id,
       moisture.recorded_at::text AS moisture_recorded_at,
       moisture.value AS moisture_value,
       moisture.reading_value AS moisture_reading_value,
       moisture.quality_flag AS moisture_quality_flag,
       color.id::text AS color_id,
       color.recorded_at::text AS color_recorded_at,
       color.value AS color_value,
       color.reading_value AS color_reading_value,
       color.quality_flag AS color_quality_flag
     FROM racks r
     JOIN farms f ON f.id = r.farm_id
     JOIN plant_locations pl ON pl.rack_id = r.id
     LEFT JOIN LATERAL (
       SELECT p_inner.*
       FROM plants p_inner
       WHERE p_inner.plant_location_id = pl.id
       ORDER BY p_inner.created_at DESC
       LIMIT 1
     ) p ON TRUE
     LEFT JOIN species sp ON sp.id = p.species_id
     LEFT JOIN LATERAL (
       SELECT sr.id, sr.recorded_at, sr.value, sr.reading_value, sr.quality_flag
       FROM sensor_readings sr
       WHERE sr.rack_id = r.id
         AND sr.row = pl.row
         AND sr.column = pl.column
         AND LOWER(sr.sensor_type) = 'light_sensor'
       ORDER BY sr.recorded_at DESC
       LIMIT 1
     ) light ON TRUE
     LEFT JOIN LATERAL (
       SELECT sr.id, sr.recorded_at, sr.value, sr.reading_value, sr.quality_flag
       FROM sensor_readings sr
       WHERE sr.rack_id = r.id
         AND sr.row = pl.row
         AND sr.column = pl.column
         AND LOWER(sr.sensor_type) = 'moisture_sensor'
       ORDER BY sr.recorded_at DESC
       LIMIT 1
     ) moisture ON TRUE
     LEFT JOIN LATERAL (
       SELECT sr.id, sr.recorded_at, sr.value, sr.reading_value, sr.quality_flag
       FROM sensor_readings sr
       WHERE sr.rack_id = r.id
         AND sr.row = pl.row
         AND sr.column = pl.column
         AND LOWER(sr.sensor_type) = 'color_camera'
       ORDER BY sr.recorded_at DESC
       LIMIT 1
     ) color ON TRUE
     ORDER BY r.rack_number, pl.row, pl.column`
  );

  const racks = new Map<string, DashboardRackSnapshot>();

  for (const row of result.rows) {
    let rack = racks.get(row.rack_id);

    if (!rack) {
      rack = {
        id: row.rack_id,
        rack_identifier: row.rack_identifier,
        rack_name: row.rack_name,
        rack_number: row.rack_number,
        rows: row.rows,
        columns: row.columns,
        max_rows: row.max_rows,
        max_columns: row.max_columns,
        farm: {
          id: row.farm_id,
          identifier: row.farm_identifier,
          name: row.farm_name
        },
        cells: []
      };

      racks.set(row.rack_id, rack);
    }

    const plant: DashboardPlantSnapshot | null = row.plant_id
      ? {
          id: row.plant_id,
          identifier: row.plant_identifier,
          display_name: row.plant_display_name,
          status: row.plant_status,
          planted_on: row.planted_on,
          harvested_on: row.harvested_on,
          updated_at: row.plant_updated_at,
          species: row.species_id
            ? {
                id: row.species_id,
                identifier: row.species_identifier,
                name: row.species_name,
                scientific_name: row.species_scientific_name
              }
            : null
        }
      : null;

    const sensors: DashboardCellSnapshot["sensors"] = {};

    const light = buildSensorSnapshot(
      row.light_recorded_at,
      row.light_value,
      row.light_reading_value,
      row.light_quality_flag,
      row.light_id,
      "light_sensor"
    );
    if (light) {
      sensors.light_sensor = light;
    }

    const moisture = buildSensorSnapshot(
      row.moisture_recorded_at,
      row.moisture_value,
      row.moisture_reading_value,
      row.moisture_quality_flag,
      row.moisture_id,
      "moisture_sensor"
    );
    if (moisture) {
      sensors.moisture_sensor = moisture;
    }

    const color = buildSensorSnapshot(
      row.color_recorded_at,
      row.color_value,
      row.color_reading_value,
      row.color_quality_flag,
      row.color_id,
      "color_camera"
    );
    if (color) {
      sensors.color_camera = color;
    }

    rack.cells.push({
      location_id: row.plant_location_id,
      row: row.row,
      column: row.column,
      is_occupied: row.is_occupied,
      plant,
      sensors
    });
  }

  return Array.from(racks.values()).map((rack) => ({
    ...rack,
    cells: rack.cells.sort((a, b) => {
      if (a.row === b.row) {
        return a.column - b.column;
      }
      return a.row - b.row;
    })
  }));
}
