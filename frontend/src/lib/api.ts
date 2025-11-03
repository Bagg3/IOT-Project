import type { RackSummary, Plant, HistoricalDataPoint } from "./types";

/**
 * Get the API base URL from environment variables
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

/**
 * Generic API request handler with error handling
 */
async function apiRequest<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    console.log(`[API Request] ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[API Success] ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Fetch all racks overview
 * GET /racks
 */
export async function fetchRacks(): Promise<RackSummary[]> {
  return apiRequest<RackSummary[]>("/racks");
}

/**
 * Fetch latest sensor readings for a specific rack
 * GET /racks/{rackId}/plants
 * 
 * Note: This endpoint expects rackId to be either UUID or rack number
 * We'll use rack_number for consistency with the frontend
 */
export async function fetchLatestSensorReadings(rackNumber: number): Promise<Plant[]> {
  return apiRequest<Plant[]>(`/racks/${rackNumber}/plants`);
}

/**
 * Fetch historical data for a specific plant location
 * GET /racks/{rackId}/locations/{row}/{column}/history?hours={hours}
 * 
 * @param rackNumber - The rack number
 * @param row - Plant row position
 * @param column - Plant column position
 * @param hours - Number of hours of history to fetch (default: 24)
 */
export async function fetchPlantHistory(
  rackNumber: number,
  row: number,
  column: number,
  hours: number = 24
): Promise<HistoricalDataPoint[]> {
  return apiRequest<HistoricalDataPoint[]>(
    `/racks/${rackNumber}/locations/${row}/${column}/history?hours=${hours}`
  );
}

/**
 * Fetch specific rack details (optional - if you need rack metadata)
 * GET /racks/{rackId}
 */
export async function fetchRackDetails(rackNumber: number): Promise<RackSummary> {
  return apiRequest<RackSummary>(`/racks/${rackNumber}`);
}