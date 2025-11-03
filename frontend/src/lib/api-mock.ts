import { MOCK_RACKS, generateMockPlants, generateHistoricalData } from "./mockData";
import type { RackSummary, Plant, HistoricalDataPoint } from "./types";

export async function fetchRacks(): Promise<RackSummary[]> {
  return MOCK_RACKS;
}

export async function fetchLatestSensorReadings(rackNumber: number): Promise<Plant[]> {
  const mockPlants = generateMockPlants();
  return mockPlants.filter((plant) => plant.rack_number === rackNumber);
}

export async function fetchPlantHistory(
  rackNumber: number,
  row: number,
  column: number
): Promise<HistoricalDataPoint[]> {
  return generateHistoricalData(row, column, rackNumber);
}
