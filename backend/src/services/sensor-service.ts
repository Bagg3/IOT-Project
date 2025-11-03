import { pool } from "../db";

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
  row: number;
  column: number;
  sensor_type: string;
  value: Record<string, unknown>;
  timestamp: string;
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

export async function createSensorReading(
  input: CreateSensorReadingInput
): Promise<SensorReadingRecord> {
  const result = await pool.query<SensorReadingRecord>(
    `INSERT INTO sensor_readings (rack_id, "row", "column", sensor_type, value)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, rack_id, "row", "column", sensor_type, value::json AS value, timestamp`,
    [
      input.rack_id,
      input.row,
      input.column,
      input.sensor_type,
      JSON.stringify(input.value)
    ]
  );

  const record = result.rows[0];
  return {
    ...record,
    value: parseJsonValue(record.value)
  };
}

export async function getLatestSensorReadings(rackId: string): Promise<SensorReadingRecord[]> {
  const result = await pool.query<SensorReadingRecord>(
    `SELECT DISTINCT ON ("row", "column", sensor_type)
       id,
       rack_id,
       "row",
       "column",
       sensor_type,
       value::json AS value,
       timestamp
     FROM sensor_readings
     WHERE rack_id = $1
     ORDER BY "row", "column", sensor_type, timestamp DESC`,
    [rackId]
  );

  return result.rows.map((row) => ({
    ...row,
    value: parseJsonValue(row.value)
  }));
}

export async function getSensorReadingHistory(params: {
  rack_id: string;
  row: number;
  column: number;
  sensor_type: string;
  hours: number;
}): Promise<SensorReadingRecord[]> {
  const result = await pool.query<SensorReadingRecord>(
    `SELECT
       id,
       rack_id,
       "row",
       "column",
       sensor_type,
       value::json AS value,
       timestamp
     FROM sensor_readings
     WHERE rack_id = $1
       AND "row" = $2
       AND "column" = $3
       AND sensor_type = $4
       AND timestamp > NOW() - ($5 || ' hours')::INTERVAL
     ORDER BY timestamp DESC`,
    [params.rack_id, params.row, params.column, params.sensor_type, params.hours]
  );

  return result.rows.map((row) => ({
    ...row,
    value: parseJsonValue(row.value)
  }));
}
