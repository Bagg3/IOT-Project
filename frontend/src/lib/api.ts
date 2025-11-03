import axios from "axios";
import { parsePercentage } from "./utils";
import { MOCK_RACKS, generateMockPlants } from "./mockData";

export interface RackSummary {
  id: string;
  rack_number: number;
  rows: number;
  columns: number;
}

export interface Plant {
  display_name: string;
  column: number;
  row: number;
  planted_at: string;
  light_level: number | null;
  moisture_level: number | null;
  color: string;
  rack_number: number;
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
  display_name: string | null;
  planted_at: string | null;
  color: string | null;
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
  // Use mock data in development
  return MOCK_RACKS;
}

export async function fetchLatestSensorReadings(rackId: string): Promise<Plant[]> {
  // Use mock data in development - filter plants by rack number extracted from rackId
  // rackId format: "rack-1", "rack-2", etc.
  const rackNumber = parseInt(rackId.replace("rack-", ""), 10);
  const mockPlants = generateMockPlants();
  return mockPlants.filter((plant) => plant.rack_number === rackNumber);
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

export function mapReadingsToCells(plants: Plant[]): CellSnapshot[] {
  return plants
    .map((plant) => ({
      rackId: `rack-${plant.rack_number}`,
      row: plant.row,
      column: plant.column,
      display_name: plant.display_name,
      planted_at: plant.planted_at,
      color: plant.color,
      moisturePercent: plant.moisture_level,
      lightPercent: plant.light_level
    }))
    .sort((a, b) => {
      if (a.row === b.row) {
        return a.column - b.column;
      }
      return a.row - b.row;
    });
}
