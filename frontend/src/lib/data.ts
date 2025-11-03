import { MOCK_RACKS, generateMockPlants, generateHistoricalData } from "./mockData";
import { getRackNumber } from "./utils";
import type { RackSummary, Plant, HistoricalDataPoint } from "./types";

export async function fetchRacks(): Promise<RackSummary[]> {
  return MOCK_RACKS;
}

export async function fetchLatestSensorReadings(rackId: string): Promise<Plant[]> {
  const rackNumber = getRackNumber(rackId);
  const mockPlants = generateMockPlants();
  return mockPlants.filter((plant) => plant.rack_number === rackNumber);
}

export async function fetchPlantHistory(
  rackId: string,
  row: number,
  column: number
): Promise<HistoricalDataPoint[]> {
  const rackNumber = getRackNumber(rackId);
  return generateHistoricalData(row, column, rackNumber);
}
