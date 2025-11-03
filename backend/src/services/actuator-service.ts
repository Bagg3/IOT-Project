import { pool } from "../db";

export type CreateActuatorCommandInput = {
  rack_id: string;
  row: number;
  column: number;
  actuator_type: string;
  action: string;
  parameters?: Record<string, unknown> | null;
};

export type ActuatorCommandRecord = {
  id: string;
  rack_id: string;
  rack_number: number;
  row: number;
  column: number;
  actuator_type: string;
  action: string;
  parameters: Record<string, unknown> | null;
  status: string;
  created_at: string;
  updated_at: string;
  farm_id: string;
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

function mapCommand(row: ActuatorCommandRecord): ActuatorCommandRecord {
  return {
    ...row,
    parameters: parseParameters(row.parameters)
  };
}

export async function createActuatorCommand(
  input: CreateActuatorCommandInput
): Promise<ActuatorCommandRecord> {
  const result = await pool.query<ActuatorCommandRecord>(
    `INSERT INTO actuator_commands (rack_id, "row", "column", actuator_type, action, parameters)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING
       id,
       rack_id,
       (SELECT rack_number FROM racks WHERE racks.id = actuator_commands.rack_id) AS rack_number,
       "row",
       "column",
       actuator_type,
       action,
       parameters::json AS parameters,
       status,
       created_at,
       updated_at,
       (SELECT farm_id FROM racks WHERE racks.id = actuator_commands.rack_id) AS farm_id`,
    [
      input.rack_id,
      input.row,
      input.column,
      input.actuator_type,
      input.action,
      input.parameters ? JSON.stringify(input.parameters) : null
    ]
  );

  const command = mapCommand(result.rows[0]);

  if (commandPublisher) {
    try {
      await commandPublisher(command);
    } catch (error) {
      console.error("Failed to publish actuator command", error);
    }
  }

  return command;
}

export async function getPendingActuatorCommands(): Promise<ActuatorCommandRecord[]> {
  const result = await pool.query<ActuatorCommandRecord>(
    `SELECT
       id,
       rack_id,
       (SELECT rack_number FROM racks WHERE racks.id = actuator_commands.rack_id) AS rack_number,
       "row",
       "column",
       actuator_type,
       action,
       parameters::json AS parameters,
       status,
       created_at,
       updated_at,
       (SELECT farm_id FROM racks WHERE racks.id = actuator_commands.rack_id) AS farm_id
     FROM actuator_commands
     WHERE status = 'pending'
     ORDER BY created_at`
  );

  return result.rows.map(mapCommand);
}

export async function updateActuatorCommandStatus(
  id: string,
  status: "pending" | "sent" | "completed" | "failed"
): Promise<ActuatorCommandRecord | null> {
  const result = await pool.query<ActuatorCommandRecord>(
    `UPDATE actuator_commands
     SET status = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING
       id,
       rack_id,
       (SELECT rack_number FROM racks WHERE racks.id = actuator_commands.rack_id) AS rack_number,
       "row",
       "column",
       actuator_type,
       action,
       parameters::json AS parameters,
       status,
       created_at,
       updated_at,
       (SELECT farm_id FROM racks WHERE racks.id = actuator_commands.rack_id) AS farm_id`,
    [status, id]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapCommand(result.rows[0]);
}
