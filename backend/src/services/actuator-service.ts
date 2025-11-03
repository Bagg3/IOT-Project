import type { QueryResultRow } from "pg";
import { pool } from "../db";
import {
  ensureActuator,
  ensureActuatorType,
  ensurePlantLocation,
  resolveRack
} from "./location-service";

export type CreateActuatorCommandInput = {
  rack_id: string;
  row: number;
  column: number;
  actuator_type: string;
  action: string;
  parameters?: Record<string, unknown> | null;
  triggered_by?: string | null;
};

export type ActuatorCommandRecord = {
  id: string;
  rack_id: string;
  rack_number: number;
  farm_id: string;
  row: number;
  column: number;
  actuator_type: string;
  action: string;
  parameters: Record<string, unknown> | null;
  status: string;
  created_at: string;
  updated_at: string;
  command_value: number | null;
  actuator_id: string | null;
  plant_location_id: string | null;
  executed_at: string | null;
  triggered_by: string | null;
  success: boolean | null;
};

type CommandRow = {
  id: string;
  rack_id: string;
  rack_number: number;
  farm_id: string;
  row: number;
  column: number;
  actuator_type: string;
  action: string;
  parameters: Record<string, unknown> | string | null;
  status: string;
  created_at: string;
  updated_at: string;
  command_value: number | null;
  actuator_id: string | null;
  plant_location_id: string | null;
  executed_at: string | null;
  triggered_by: string | null;
  success: boolean | null;
};

export type ActuatorCommandPublisher = (command: ActuatorCommandRecord) => Promise<void> | void;

let commandPublisher: ActuatorCommandPublisher | null = null;

export function registerActuatorCommandPublisher(publisher: ActuatorCommandPublisher): void {
  commandPublisher = publisher;
}

function parseParameters(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return null;
}

function extractCommandValue(parameters: Record<string, unknown> | null): number | null {
  if (!parameters) {
    return null;
  }

  const candidates = [parameters.value, parameters.intensity, parameters.duration];

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

function mapCommand(row: CommandRow): ActuatorCommandRecord {
  return {
    ...row,
    parameters: parseParameters(row.parameters)
  };
}

async function selectCommands(whereClause: string, parameters: unknown[]): Promise<ActuatorCommandRecord[]> {
  const result = await pool.query<CommandRow & QueryResultRow>(
    `SELECT
       ac.id,
       COALESCE(ac.rack_identifier, r.rack_identifier, r.id::text) AS rack_id,
       r.rack_number,
       COALESCE(ac.farm_identifier, f.farm_identifier, f.id::text) AS farm_id,
       ac.row,
       ac.column,
       ac.actuator_type,
       ac.action,
       ac.parameters::json AS parameters,
       ac.status,
       ac.created_at,
       ac.updated_at,
       ac.command_value,
       ac.actuator_id,
       ac.plant_location_id,
       ac.executed_at,
       ac.triggered_by,
       ac.success
     FROM actuator_commands ac
     JOIN racks r ON r.id = ac.rack_id
     JOIN farms f ON f.id = r.farm_id
     WHERE ${whereClause}
     ORDER BY ac.created_at`,
    parameters
  );

  return result.rows.map(mapCommand);
}

export async function createActuatorCommand(
  input: CreateActuatorCommandInput
): Promise<ActuatorCommandRecord> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const rack = await resolveRack(client, input.rack_id);
    const plantLocation = await ensurePlantLocation(client, rack.id, input.row, input.column);
    const actuatorType = await ensureActuatorType(client, input.actuator_type);
    const actuator = await ensureActuator(
      client,
      plantLocation.id,
      actuatorType,
      rack,
      input.row,
      input.column
    );

    const rawParameters = input.parameters ?? null;
    const commandValue = extractCommandValue(rawParameters);
    const triggeredBy = input.triggered_by ?? "api";

    const insertResult = await client.query<{ id: string } & QueryResultRow>(
      `INSERT INTO actuator_commands (
         rack_id,
         row,
         column,
         actuator_type,
         action,
         parameters,
         actuator_id,
         plant_location_id,
         command_type,
         command_value,
         triggered_by,
         farm_identifier,
         rack_identifier
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING
         id`,
      [
        rack.id,
        input.row,
        input.column,
        actuatorType.type_name,
        input.action,
        rawParameters ? JSON.stringify(rawParameters) : null,
        actuator.id,
        plantLocation.id,
        input.action,
        commandValue,
        triggeredBy,
        rack.farm_identifier,
        rack.rack_identifier
      ]
    );

    await client.query("COMMIT");

    const [command] = await selectCommands("ac.id = $1", [insertResult.rows[0].id]);

    if (!command) {
      throw new Error("Failed to load actuator command after insert");
    }

    if (commandPublisher) {
      try {
        await commandPublisher(command);
      } catch (error) {
        console.error("Failed to publish actuator command", error);
      }
    }

    return command;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getPendingActuatorCommands(): Promise<ActuatorCommandRecord[]> {
  return selectCommands("ac.status = 'pending'", []);
}

export async function updateActuatorCommandStatus(
  id: string,
  status: "pending" | "sent" | "completed" | "failed"
): Promise<ActuatorCommandRecord | null> {
  const updateFields: string[] = ["status = $1", "updated_at = NOW()"];
  const parameters: unknown[] = [status, id];

  if (status === "completed" || status === "failed") {
    updateFields.push("executed_at = NOW()", "success = $3");
    parameters.push(status === "completed");
  }

  const result = await pool.query<CommandRow & QueryResultRow>(
    `UPDATE actuator_commands
     SET ${updateFields.join(", ")}
     WHERE id = $2
     RETURNING
       id,
       row,
       column,
       actuator_type,
       action,
       parameters::json AS parameters,
       status,
       created_at,
       updated_at,
       command_value,
       actuator_id,
       plant_location_id,
       executed_at,
       triggered_by,
       success`,
    parameters
  );

  if (result.rowCount === 0) {
    return null;
  }

  const [command] = await selectCommands("ac.id = $1", [result.rows[0].id]);
  return command ?? null;
}
