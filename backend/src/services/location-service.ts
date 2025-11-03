import type { PoolClient, QueryResultRow } from "pg";
import { pool } from "../db";

export type Queryable = Pick<PoolClient, "query">;

export type ResolvedFarm = {
  id: string;
  farm_identifier: string;
  farm_name: string;
};

export type ResolvedRack = {
  id: string;
  rack_identifier: string;
  rack_number: number;
  farm_id: string;
  farm_identifier: string;
  farm_name: string;
  max_rows: number;
  max_columns: number;
};

export type PlantLocationRow = {
  id: string;
  rack_id: string;
  row: number;
  column: number;
  is_occupied: boolean;
};

export type SensorTypeRow = {
  id: string;
  type_name: string;
  unit_of_measurement: string | null;
};

export type SensorRow = {
  id: string;
  sensor_identifier: string | null;
  sensor_name: string | null;
  plant_location_id: string;
  sensor_type_id: string;
};

export type ActuatorTypeRow = {
  id: string;
  type_name: string;
  control_unit: string | null;
};

export type ActuatorRow = {
  id: string;
  actuator_identifier: string | null;
  actuator_name: string | null;
  plant_location_id: string;
  actuator_type_id: string;
};

export async function resolveRack(
  client: Queryable,
  rackIdentifierOrId: string
): Promise<ResolvedRack> {
  const result = await client.query<ResolvedRack & QueryResultRow>(
    `SELECT
       r.id,
       COALESCE(r.rack_identifier, r.id::text) AS rack_identifier,
       r.rack_number,
       r.farm_id,
       COALESCE(f.farm_identifier, f.id::text) AS farm_identifier,
       f.farm_name,
       COALESCE(r.max_rows, r.rows) AS max_rows,
       COALESCE(r.max_columns, r.columns) AS max_columns
     FROM racks r
     JOIN farms f ON f.id = r.farm_id
     WHERE r.id::text = $1 OR r.rack_identifier = $1
     LIMIT 1`,
    [rackIdentifierOrId]
  );

  if (result.rowCount === 0) {
    throw new Error(`Rack not found for identifier ${rackIdentifierOrId}`);
  }

  return result.rows[0];
}

export async function ensurePlantLocation(
  client: Queryable,
  rackId: string,
  row: number,
  column: number
): Promise<PlantLocationRow> {
  const result = await client.query<PlantLocationRow & QueryResultRow>(
    `INSERT INTO plant_locations (rack_id, row, column)
     VALUES ($1, $2, $3)
     ON CONFLICT (rack_id, row, column)
     DO UPDATE SET updated_at = NOW()
     RETURNING id, rack_id, row, column, is_occupied`,
    [rackId, row, column]
  );

  return result.rows[0];
}

export async function ensureSensorType(
  client: Queryable,
  typeName: string
): Promise<SensorTypeRow> {
  const normalized = typeName.trim().toLowerCase();

  const result = await client.query<SensorTypeRow & QueryResultRow>(
    `INSERT INTO sensor_types (type_name)
     VALUES ($1)
     ON CONFLICT (type_name) DO UPDATE SET type_name = EXCLUDED.type_name
     RETURNING id, type_name, unit_of_measurement`,
    [normalized]
  );

  return result.rows[0];
}

export async function ensureSensor(
  client: Queryable,
  plantLocationId: string,
  sensorType: SensorTypeRow,
  rack: ResolvedRack,
  row: number,
  column: number
): Promise<SensorRow> {
  const friendlyName = `${sensorType.type_name} - Rack ${rack.rack_number} (${row},${column})`;

  const result = await client.query<SensorRow & QueryResultRow>(
    `INSERT INTO sensors (plant_location_id, sensor_type_id, sensor_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (plant_location_id, sensor_type_id)
     DO UPDATE SET sensor_name = COALESCE(sensors.sensor_name, EXCLUDED.sensor_name), updated_at = NOW()
     RETURNING id, sensor_identifier, sensor_name, plant_location_id, sensor_type_id`,
    [plantLocationId, sensorType.id, friendlyName]
  );

  return result.rows[0];
}

export async function ensureActuatorType(
  client: Queryable,
  typeName: string
): Promise<ActuatorTypeRow> {
  const normalized = typeName.trim().toLowerCase();

  const result = await client.query<ActuatorTypeRow & QueryResultRow>(
    `INSERT INTO actuator_types (type_name)
     VALUES ($1)
     ON CONFLICT (type_name) DO UPDATE SET type_name = EXCLUDED.type_name
     RETURNING id, type_name, control_unit`,
    [normalized]
  );

  return result.rows[0];
}

export async function ensureActuator(
  client: Queryable,
  plantLocationId: string,
  actuatorType: ActuatorTypeRow,
  rack: ResolvedRack,
  row: number,
  column: number
): Promise<ActuatorRow> {
  const friendlyName = `${actuatorType.type_name} - Rack ${rack.rack_number} (${row},${column})`;

  const result = await client.query<ActuatorRow & QueryResultRow>(
    `INSERT INTO actuators (plant_location_id, actuator_type_id, actuator_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (plant_location_id, actuator_type_id)
     DO UPDATE SET actuator_name = COALESCE(actuators.actuator_name, EXCLUDED.actuator_name), updated_at = NOW()
     RETURNING id, actuator_identifier, actuator_name, plant_location_id, actuator_type_id`,
    [plantLocationId, actuatorType.id, friendlyName]
  );

  return result.rows[0];
}

export async function resolveFarmByIdentifier(
  client: Queryable,
  farmIdentifierOrId: string
): Promise<ResolvedFarm> {
  const result = await client.query<ResolvedFarm & QueryResultRow>(
    `SELECT id, COALESCE(farm_identifier, id::text) AS farm_identifier, farm_name
     FROM farms
     WHERE id::text = $1 OR farm_identifier = $1
     LIMIT 1`,
    [farmIdentifierOrId]
  );

  if (result.rowCount === 0) {
    throw new Error(`Farm not found for identifier ${farmIdentifierOrId}`);
  }

  return result.rows[0];
}

export async function withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}
