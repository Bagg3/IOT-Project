import axios from "axios";
import { parsePercentage } from "./utils";

export interface RackSummary {
  id: string;
  rack_number: number;
  rows: number;
  columns: number;
  farm_id: string;
  farm_name?: string;
}

export interface SensorReading {
  id: string;
  rack_id: string;
  row: number;
  column: number;
  sensor_type: string;
  value: Record<string, unknown>;
  timestamp: string;
}

export interface ActuatorCommandPayload {
  rack_id: string;
  row: number;
  column: number;
  actuator_type: string;
  action: string;
  parameters?: Record<string, unknown>;
}

export interface ActuatorCommandResponse {
  id: string;
}

export interface CellSnapshot {
  rackId: string;
  row: number;
  column: number;
  sensors: Record<string, SensorReading>;
  moisturePercent: number | null;
  lightPercent: number | null;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

export async function fetchRacks() {
  const { data } = await apiClient.get<RackSummary[]>("/dashboard/racks");
  return data;
}

export async function fetchLatestSensorReadings(rackId: string) {
  const { data } = await apiClient.get<SensorReading[]>(`/sensor-readings/latest/${rackId}`);
  return data;
}

interface SensorHistoryPayload {
  rack_id: string;
  row: number;
  column: number;
  sensor_type: string;
  hours?: number;
}

export async function fetchSensorHistory(payload: SensorHistoryPayload) {
  const searchParams = new URLSearchParams({
    rack_id: payload.rack_id,
    row: String(payload.row),
    column: String(payload.column),
    sensor_type: payload.sensor_type,
    hours: String(payload.hours ?? 6)
  });
  const { data } = await apiClient.get<SensorReading[]>(`/sensor-readings/history?${searchParams.toString()}`);
  return data;
}

export async function postActuatorCommand(payload: ActuatorCommandPayload) {
  const { data } = await apiClient.post<ActuatorCommandResponse>("/actuator-commands", payload);
  return data;
}

function extractReadingValue(reading: SensorReading) {
  const candidate = reading.value;
  if (candidate && typeof candidate === "object" && "value" in candidate) {
    return (candidate as { value: unknown }).value;
  }
  return candidate;
}

export function mapReadingsToCells(readings: SensorReading[]): CellSnapshot[] {
  const cells = new Map<string, CellSnapshot>();

  readings.forEach((reading) => {
    const key = `${reading.row}:${reading.column}`;
    if (!cells.has(key)) {
      cells.set(key, {
        rackId: reading.rack_id,
        row: reading.row,
        column: reading.column,
        sensors: {},
        moisturePercent: null,
        lightPercent: null
      });
    }

    const cell = cells.get(key);
    if (!cell) {
      return;
    }

    cell.sensors[reading.sensor_type] = reading;

    const numericValue = extractReadingValue(reading);

    if (reading.sensor_type.toLowerCase().includes("moisture")) {
      cell.moisturePercent = parsePercentage(numericValue);
    }
    if (reading.sensor_type.toLowerCase().includes("light")) {
      cell.lightPercent = parsePercentage(numericValue);
    }
  });

  return Array.from(cells.values()).sort((a, b) => {
    if (a.row === b.row) {
      return a.column - b.column;
    }
    return a.row - b.row;
  });
}
