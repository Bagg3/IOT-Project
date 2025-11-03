/**
 * Data fetching functions for mock data
 * All functions use in-memory mock data for development
 */

import { MOCK_RACKS, generateMockPlants, generateHistoricalData } from "./mockData";
import type { RackSummary, Plant, CellSnapshot, HistoricalDataPoint } from "./types";

export async function fetchRacks(): Promise<RackSummary[]> {
  return MOCK_RACKS;
}

export async function fetchLatestSensorReadings(rackId: string): Promise<Plant[]> {
  const rackNumber = parseInt(rackId.replace("rack-", ""), 10);
  const mockPlants = generateMockPlants();
  return mockPlants.filter((plant) => plant.rack_number === rackNumber);
}

export async function fetchPlantHistory(
  rackId: string,
  row: number,
  column: number
): Promise<HistoricalDataPoint[]> {
  const rackNumber = parseInt(rackId.replace("rack-", ""), 10);
  return generateHistoricalData(row, column, rackNumber);
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
