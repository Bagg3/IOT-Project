import type { QueryResultRow } from "pg";
import { pool } from "../db";
import { ensurePlantLocation, resolveRack } from "./location-service";

export type ActuatorSummary = {
  id: string;
  type: string;
  name: string | null;
};

export type SensorSnapshot = {
  recorded_at: string;
  value: number | null;
  payload: Record<string, unknown>;
  quality: string | null;
};

export type SensorSnapshotSet = {
  moisture_sensor?: SensorSnapshot;
  light_sensor?: SensorSnapshot;
  color_camera?: SensorSnapshot;
};

export type PlantDetails = {
  id: string;
  display_name: string | null;
  status: string | null;
  planted_on: string | null;
  harvested_on: string | null;
  species: {
    id: string;
    name: string | null;
    scientific_name: string | null;
  } | null;
};

export type RackCellSnapshot = {
  location_id: string;
  row: number;
  column: number;
  plant: PlantDetails | null;
  latest_readings: SensorSnapshotSet;
  actuators: ActuatorSummary[];
};

export type RackSnapshot = {
  id: string;
  rack_number: number;
  name: string | null;
  rows: number;
  columns: number;
  farm: {
    id: string;
    name: string | null;
  };
  cells: RackCellSnapshot[];
};

export type PlantReading = {
  rack_id: string;
  rack_number: number;
  location_id: string;
  row: number;
  column: number;
  plant_id: string | null;
  display_name: string | null;
  planted_at: string | null;
  moisture_level: number | null;
  light_level: number | null;
  color: string | null;
  species_name: string | null;
  actuators: ActuatorSummary[];
};

export type HistoricalDataPoint = {
  timestamp: string;
  moisture: number | null;
  light: number | null;
  color: string | null;
};

type RackSnapshotRow = {
  rack_id: string;
  rack_number: number;
  rack_name: string | null;
  rows: number;
  columns: number;
  farm_id: string;
  farm_name: string | null;
  plant_location_id: string;
  row: number;
  column: number;
  plant_id: string | null;
  plant_display_name: string | null;
  plant_status: string | null;
  planted_on: string | null;
  harvested_on: string | null;
  species_id: string | null;
  species_name: string | null;
  species_scientific_name: string | null;
  light_recorded_at: string | null;
  light_value: unknown;
  light_reading_value: number | null;
  light_quality_flag: string | null;
  moisture_recorded_at: string | null;
  moisture_value: unknown;
  moisture_reading_value: number | null;
  moisture_quality_flag: string | null;
  color_recorded_at: string | null;
  color_value: unknown;
  color_reading_value: number | null;
  color_quality_flag: string | null;
  actuator_list: unknown;
} & QueryResultRow;

type HistoricalRow = {
  recorded_at: Date;
  sensor_type: string;
  reading_value: number | null;
  value: unknown;
} & QueryResultRow;

function parseJson(value: unknown): Record<string, unknown> {
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

function extractNumeric(payload: Record<string, unknown>, fallback: number | null): number | null {
  const candidates = [payload.value, payload.reading, payload.level, fallback];

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

function parseActuatorList(value: unknown): ActuatorSummary[] {
  const rawArray = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (safeJsonParse(value, []) as unknown[])
      : [];

  return rawArray
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Record<string, unknown>;
      const id = typeof data.id === "string" ? data.id : null;
      const type = typeof data.type === "string" ? data.type : null;

      if (!id || !type) {
        return null;
      }

      return {
        id,
        type,
        name: typeof data.name === "string" ? data.name : null
      } satisfies ActuatorSummary;
    })
    .filter((item): item is ActuatorSummary => item !== null);
}

function safeJsonParse(value: string, fallback: unknown): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function buildSensorSnapshot(
  recordedAt: string | null,
  rawValue: unknown,
  readingValue: number | null,
  quality: string | null,
  sensorType?: string
): SensorSnapshot | undefined {
  if (!recordedAt) {
    return undefined;
  }

  const payload = parseJson(rawValue);
  let value = extractNumeric(payload, readingValue);

  // Scale moisture sensor readings to percentage
  if (sensorType === "moisture_sensor" && value !== null) {
    value = value * 100;
  }

  return {
    recorded_at: recordedAt,
    value,
    payload,
    quality: quality ?? null
  };
}

function extractColorPayload(sensor?: SensorSnapshot): string | null {
  if (!sensor) {
    return null;
  }

  const preferredKeys = ["hex", "color", "colour", "status_color", "value"];

  for (const key of preferredKeys) {
    const candidate = sensor.payload[key];
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  if (sensor.value !== null) {
    return sensor.value.toString();
  }

  return null;
}

function upsertRackSnapshot(map: Map<string, RackSnapshot>, row: RackSnapshotRow): RackSnapshot {
  const existing = map.get(row.rack_id);
  if (existing) {
    return existing;
  }

  const rack: RackSnapshot = {
    id: row.rack_id,
    rack_number: row.rack_number,
    name: row.rack_name,
    rows: row.rows,
    columns: row.columns,
    farm: {
      id: row.farm_id,
      name: row.farm_name
    },
    cells: []
  };

  map.set(row.rack_id, rack);
  return rack;
}

export async function getRackSnapshots(rackIdentifier?: string): Promise<RackSnapshot[]> {
  const conditions: string[] = [];
  const parameters: unknown[] = [];

  if (rackIdentifier) {
    parameters.push(rackIdentifier);
    conditions.push("(r.id::text = $1 OR r.rack_number::text = $1)");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      r.id::text AS rack_id,
      r.rack_number,
      r.rack_name,
      r.rows,
      r.columns,
      f.id::text AS farm_id,
      f.farm_name,
      pl.id::text AS plant_location_id,
      pl.row,
      pl.column,
      p.id::text AS plant_id,
      p.display_name AS plant_display_name,
      p.status AS plant_status,
      p.planted_on::text AS planted_on,
      p.harvested_on::text AS harvested_on,
      sp.id::text AS species_id,
      sp.species_name,
      sp.scientific_name AS species_scientific_name,
      light.recorded_at::text AS light_recorded_at,
      light.value AS light_value,
      light.reading_value AS light_reading_value,
      light.quality_flag AS light_quality_flag,
      moisture.recorded_at::text AS moisture_recorded_at,
      moisture.value AS moisture_value,
      moisture.reading_value AS moisture_reading_value,
      moisture.quality_flag AS moisture_quality_flag,
      color.recorded_at::text AS color_recorded_at,
      color.value AS color_value,
      color.reading_value AS color_reading_value,
      color.quality_flag AS color_quality_flag,
      COALESCE(actuators.data, '[]'::json) AS actuator_list
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
      SELECT sr.recorded_at, sr.value, sr.reading_value, sr.quality_flag
      FROM sensor_readings sr
      WHERE sr.rack_id = r.id
        AND sr.row = pl.row
        AND sr.column = pl.column
        AND LOWER(sr.sensor_type) = 'light_sensor'
      ORDER BY sr.recorded_at DESC
      LIMIT 1
    ) light ON TRUE
    LEFT JOIN LATERAL (
      SELECT sr.recorded_at, sr.value, sr.reading_value, sr.quality_flag
      FROM sensor_readings sr
      WHERE sr.rack_id = r.id
        AND sr.row = pl.row
        AND sr.column = pl.column
        AND LOWER(sr.sensor_type) = 'moisture_sensor'
      ORDER BY sr.recorded_at DESC
      LIMIT 1
    ) moisture ON TRUE
    LEFT JOIN LATERAL (
      SELECT sr.recorded_at, sr.value, sr.reading_value, sr.quality_flag
      FROM sensor_readings sr
      WHERE sr.rack_id = r.id
        AND sr.row = pl.row
        AND sr.column = pl.column
        AND LOWER(sr.sensor_type) = 'color_camera'
      ORDER BY sr.recorded_at DESC
      LIMIT 1
    ) color ON TRUE
    LEFT JOIN LATERAL (
      SELECT json_agg(
        json_build_object(
          'id', a.id::text,
          'type', at.type_name,
          'name', a.actuator_name
        ) ORDER BY at.type_name
      ) AS data
      FROM actuators a
      JOIN actuator_types at ON at.id = a.actuator_type_id
      WHERE a.plant_location_id = pl.id
    ) actuators ON TRUE
    ${whereClause}
    ORDER BY r.rack_number, pl.row, pl.column`;

  const result = await pool.query<RackSnapshotRow>(query, parameters);
  const racks = new Map<string, RackSnapshot>();

  for (const row of result.rows) {
    const rack = upsertRackSnapshot(racks, row);

    const sensors: SensorSnapshotSet = {};

    const moisture = buildSensorSnapshot(
      row.moisture_recorded_at,
      row.moisture_value,
      row.moisture_reading_value,
      row.moisture_quality_flag,
      "moisture_sensor"
    );
    if (moisture) {
      sensors.moisture_sensor = moisture;
    }

    const light = buildSensorSnapshot(
      row.light_recorded_at,
      row.light_value,
      row.light_reading_value,
      row.light_quality_flag,
      "light_sensor"
    );
    if (light) {
      sensors.light_sensor = light;
    }

    const color = buildSensorSnapshot(
      row.color_recorded_at,
      row.color_value,
      row.color_reading_value,
      row.color_quality_flag,
      "color_camera"
    );
    if (color) {
      sensors.color_camera = color;
    }

    const plant: PlantDetails | null = row.plant_id
      ? {
          id: row.plant_id,
          display_name: row.plant_display_name,
          status: row.plant_status,
          planted_on: row.planted_on,
          harvested_on: row.harvested_on,
          species: row.species_id
            ? {
                id: row.species_id,
                name: row.species_name,
                scientific_name: row.species_scientific_name
              }
            : null
        }
      : null;

    rack.cells.push({
      location_id: row.plant_location_id,
      row: row.row,
      column: row.column,
      plant,
      latest_readings: sensors,
      actuators: parseActuatorList(row.actuator_list)
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

export async function getRackPlantReadings(rackIdentifier: string): Promise<PlantReading[]> {
  const [rack] = await getRackSnapshots(rackIdentifier);
  if (!rack) {
    return [];
  }

  return rack.cells.map((cell) => {
    const moisture = cell.latest_readings.moisture_sensor?.value ?? null;
    const light = cell.latest_readings.light_sensor?.value ?? null;
    const color = extractColorPayload(cell.latest_readings.color_camera);

    return {
      rack_id: rack.id,
      rack_number: rack.rack_number,
      location_id: cell.location_id,
      row: cell.row,
      column: cell.column,
      plant_id: cell.plant?.id ?? null,
      display_name: cell.plant?.display_name ?? null,
      planted_at: cell.plant?.planted_on ?? null,
      moisture_level: moisture,
      light_level: light,
      color,
      species_name: cell.plant?.species?.name ?? null,
      actuators: cell.actuators
    } satisfies PlantReading;
  });
}

export async function getPlantLocationHistory(
  rackIdentifier: string,
  row: number,
  column: number,
  options: { from?: Date; to?: Date; hours?: number } = {}
): Promise<HistoricalDataPoint[]> {
  const rack = await resolveRack(pool, rackIdentifier);
  const location = await ensurePlantLocation(pool, rack.id, row, column);

  const plantResult = await pool.query<{
    id: string;
    planted_on: string;
    harvested_on: string | null;
  } & QueryResultRow>(
    `SELECT id::text AS id, planted_on::text AS planted_on, harvested_on::text AS harvested_on
     FROM plants
     WHERE plant_location_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [location.id]
  );

  if (plantResult.rowCount === 0) {
    return [];
  }

  const plant = plantResult.rows[0];
  const now = new Date();
  const plantedAt = parseDateAtMidnight(plant.planted_on) ?? now;
  const harvestedAt = plant.harvested_on ? parseDateAtMidnight(plant.harvested_on) : null;

  const effectiveHours = options.from || options.to ? undefined : options.hours ?? 24;

  if (effectiveHours !== undefined && effectiveHours <= 0) {
    return [];
  }

  let start = options.from ?? (effectiveHours ? new Date(now.getTime() - effectiveHours * 60 * 60 * 1000) : plantedAt);
  let end = options.to ?? now;

  if (start < plantedAt) {
    start = plantedAt;
  }

  if (harvestedAt && harvestedAt < end) {
    end = harvestedAt;
  }

  if (end < start) {
    return [];
  }

  // Calculate optimal bucket interval based on time range
  const timeRangeMs = end.getTime() - start.getTime();
  const timeRangeHours = timeRangeMs / (1000 * 60 * 60);
  
  let bucketInterval: string;
  if (timeRangeHours <= 1) {
    bucketInterval = '2 minutes';      // ~30 points for 1 hour
  } else if (timeRangeHours <= 6) {
    bucketInterval = '15 minutes';     // ~24 points for 6 hours
  } else if (timeRangeHours <= 24) {
    bucketInterval = '1 hour';         // ~24 points for 24 hours
  } else if (timeRangeHours <= 168) {  // 1 week
    bucketInterval = '6 hours';        // ~28 points for 1 week
  } else if (timeRangeHours <= 720) {  // 30 days
    bucketInterval = '1 day';          // ~30 points for 30 days
  } else {
    bucketInterval = '3 days';         // ~20 points for 60 days
  }

  // Use PostgreSQL's date_bin for efficient time bucketing
  const aggregatedReadings = await pool.query<{
    bucket: Date;
    avg_moisture: number | null;
    avg_light: number | null;
    latest_color: string | null;
  } & QueryResultRow>(
    `WITH bucketed_data AS (
      SELECT
        date_bin($6::interval, recorded_at, $4::timestamptz) AS bucket,
        LOWER(sensor_type) AS sensor_type,
        CASE 
          WHEN LOWER(sensor_type) = 'moisture_sensor' THEN
            COALESCE(
              reading_value,
              CASE 
                WHEN jsonb_typeof(value::jsonb) = 'number' THEN (value::jsonb)::text::numeric
                WHEN value::jsonb ? 'value' AND jsonb_typeof(value::jsonb->'value') = 'number' THEN (value::jsonb->>'value')::numeric
                ELSE NULL
              END
            ) * 100
          WHEN LOWER(sensor_type) = 'light_sensor' THEN
            COALESCE(
              reading_value,
              CASE 
                WHEN jsonb_typeof(value::jsonb) = 'number' THEN (value::jsonb)::text::numeric
                WHEN value::jsonb ? 'value' AND jsonb_typeof(value::jsonb->'value') = 'number' THEN (value::jsonb->>'value')::numeric
                ELSE NULL
              END
            )
          ELSE NULL
        END AS numeric_value,
        CASE
          WHEN LOWER(sensor_type) = 'color_camera' THEN
            COALESCE(
              value::jsonb->>'hex',
              value::jsonb->>'color',
              value::jsonb->>'colour',
              value::jsonb->>'status_color',
              value::jsonb->>'value'
            )
          ELSE NULL
        END AS color_value,
        recorded_at
      FROM sensor_readings
      WHERE rack_id = $1
        AND "row" = $2
        AND "column" = $3
        AND recorded_at >= $4
        AND recorded_at <= $5
        AND LOWER(sensor_type) IN ('moisture_sensor', 'light_sensor', 'color_camera')
    )
    SELECT
      bucket,
      AVG(CASE WHEN sensor_type = 'moisture_sensor' THEN numeric_value END) AS avg_moisture,
      AVG(CASE WHEN sensor_type = 'light_sensor' THEN numeric_value END) AS avg_light,
      (array_remove(array_agg(color_value ORDER BY recorded_at DESC) FILTER (WHERE sensor_type = 'color_camera'), NULL))[1] AS latest_color
    FROM bucketed_data
    GROUP BY bucket
    ORDER BY bucket ASC`,
    [rack.id, row, column, start.toISOString(), end.toISOString(), bucketInterval]
  );

  if (aggregatedReadings.rowCount === 0) {
    return [];
  }

  // Fill null values with last known values (forward-fill)
  const result: HistoricalDataPoint[] = [];
  let lastMoisture: number | null = null;
  let lastLight: number | null = null;
  let lastColor: string | null = null;

  for (const reading of aggregatedReadings.rows) {
    if (reading.avg_moisture !== null) lastMoisture = reading.avg_moisture;
    if (reading.avg_light !== null) lastLight = reading.avg_light;
    if (reading.latest_color !== null) lastColor = reading.latest_color;

    result.push({
      timestamp: reading.bucket.toISOString(),
      moisture: reading.avg_moisture ?? lastMoisture,
      light: reading.avg_light ?? lastLight,
      color: reading.latest_color ?? lastColor
    });
  }

  return result;
}

function parseDateAtMidnight(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed);
}
