import type { PoolClient, QueryResultRow } from "pg";
import { pool } from "../db";
import { ensurePlantLocation, ensureSensor, ensureSensorType, resolveRack } from "./location-service";

export type CreateSensorReadingInput = {
  rack_id: string;
  row: number;
  column: number;
  sensor_type: string;
  value: Record<string, unknown>;
};

export type SensorReadingRecord = {
  id: string;
  rack_id: string;
  rack_number: number;
  farm_id: string;
  row: number;
  column: number;
  sensor_type: string;
  sensor_id: string | null;
  sensor_name: string | null;
  plant_location_id: string | null;
  plant_id: string | null;
  plant_display_name: string | null;
  plant_status: string | null;
  species_id: string | null;
  species_name: string | null;
  species_scientific_name: string | null;
  value: Record<string, unknown>;
  reading_value: number | null;
  quality_flag: string | null;
  recorded_at: string;
  timestamp: string;
};

type SensorReadingRow = {
  id: string;
  rack_id: string;
  rack_number: number;
  farm_id: string;
  row: number;
  column: number;
  sensor_type: string;
  sensor_id: string | null;
  sensor_name: string | null;
  plant_location_id: string | null;
  plant_id: string | null;
  plant_display_name: string | null;
  plant_status: string | null;
  species_id: string | null;
  species_name: string | null;
  species_scientific_name: string | null;
  value: Record<string, unknown> | string | null;
  reading_value: number | null;
  quality_flag: string | null;
  recorded_at: string;
};

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

function extractReadingValue(payload: Record<string, unknown>): number | null {
  const candidates = [payload.value, payload.reading, payload.level];
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === "string") {
      const parsed = Number.parseFloat(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function extractQualityFlag(payload: Record<string, unknown>): string | null {
  const quality = payload.quality_flag ?? payload.quality ?? payload.status;
  if (typeof quality === "string" && quality.trim().length > 0) {
    return quality.trim();
  }

  return null;
}

function mapRow(row: SensorReadingRow): SensorReadingRecord {
  return {
    ...row,
    rack_id: row.rack_id,
    value: parseJsonValue(row.value),
    timestamp: row.recorded_at
  };
}

async function selectReadings(
  client: PoolClient,
  whereClause: string,
  parameters: unknown[],
  distinctLatest: boolean
): Promise<SensorReadingRecord[]> {
  const distinct = distinctLatest ? "DISTINCT ON (sr.\"row\", sr.\"column\", sr.sensor_type)" : "";
  const orderByLatest = distinctLatest
    ? "ORDER BY sr.\"row\", sr.\"column\", sr.sensor_type, sr.recorded_at DESC"
    : "ORDER BY sr.recorded_at DESC";

  const query = `
    SELECT ${distinct}
      sr.id,
      r.id::text AS rack_id,
      r.rack_number,
      f.id::text AS farm_id,
      sr."row" AS row,
      sr."column" AS column,
      sr.sensor_type,
      sr.sensor_id,
      s.sensor_name,
      pl.id AS plant_location_id,
      p.id AS plant_id,
      p.display_name AS plant_display_name,
      p.status AS plant_status,
      sp.id AS species_id,
      sp.species_name,
      sp.scientific_name AS species_scientific_name,
      sr.value::json AS value,
      sr.reading_value,
      sr.quality_flag,
      sr.recorded_at
    FROM sensor_readings sr
    JOIN racks r ON r.id = sr.rack_id
    JOIN farms f ON f.id = r.farm_id
    LEFT JOIN sensors s ON s.id = sr.sensor_id
  LEFT JOIN plant_locations pl ON pl.rack_id = r.id AND pl.row = sr."row" AND pl.column = sr."column"
    LEFT JOIN LATERAL (
      SELECT p_inner.*
      FROM plants p_inner
      WHERE p_inner.plant_location_id = pl.id
      ORDER BY p_inner.created_at DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN species sp ON sp.id = p.species_id
    WHERE ${whereClause}
    ${orderByLatest}`;

  const result = await client.query<SensorReadingRow & QueryResultRow>(query, parameters);
  return result.rows.map(mapRow);
}

export async function createSensorReading(
  input: CreateSensorReadingInput
): Promise<SensorReadingRecord> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const rack = await resolveRack(client, input.rack_id);
    const plantLocation = await ensurePlantLocation(client, rack.id, input.row, input.column);
    const sensorType = await ensureSensorType(client, input.sensor_type);
    const sensor = await ensureSensor(
      client,
      plantLocation.id,
      sensorType,
      rack,
      input.row,
      input.column
    );

    const payload = input.value;
    const readingValue = extractReadingValue(payload);
    const qualityFlag = extractQualityFlag(payload) ?? "ok";

    const insertResult = await client.query<{ id: string } & QueryResultRow>(
      `INSERT INTO sensor_readings (
         rack_id,
         "row",
         "column",
         sensor_type,
         value,
         sensor_id,
         reading_value,
         quality_flag
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        rack.id,
        input.row,
        input.column,
        sensorType.type_name,
        JSON.stringify(payload),
        sensor.id,
        readingValue,
        qualityFlag
      ]
    );

    const readings = await selectReadings(
      client,
      "sr.id = $1",
      [insertResult.rows[0].id],
      false
    );

    await client.query("COMMIT");

    return readings[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getLatestSensorReadings(rackIdentifier: string): Promise<SensorReadingRecord[]> {
  const client = await pool.connect();
  try {
    const rack = await resolveRack(client, rackIdentifier);
    return await selectReadings(client, "sr.rack_id = $1", [rack.id], true);
  } finally {
    client.release();
  }
}

export async function getSensorReadingHistory(params: {
  rack_id: string;
  row: number;
  column: number;
  sensor_type: string;
  hours: number;
}): Promise<SensorReadingRecord[]> {
  const client = await pool.connect();

  try {
    const rack = await resolveRack(client, params.rack_id);

    return await selectReadings(
      client,
      `sr.rack_id = $1
       AND sr."row" = $2
       AND sr."column" = $3
       AND sr.sensor_type = $4
       AND sr.recorded_at > NOW() - ($5 || ' hours')::INTERVAL`,
      [rack.id, params.row, params.column, params.sensor_type, params.hours],
      false
    );
  } finally {
    client.release();
  }
}
