import type { RackSummary, Plant, HistoricalDataPoint } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Generic API request handler with error handling
async function apiRequest<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

// Fetch all racks overview (GET /racks)
export async function fetchRacks(): Promise<RackSummary[]> {
  return apiRequest<RackSummary[]>("/racks");
}

// Fetch latest sensor readings for a rack (GET /racks/{rackId}/plants)
export async function fetchLatestSensorReadings(rackNumber: number): Promise<Plant[]> {
  return apiRequest<Plant[]>(`/racks/${rackNumber}/plants`);
}

// Fetch historical data for a plant location (GET /racks/{rackId}/locations/{row}/{column}/history?hours=1)
export async function fetchPlantHistory(
  rackNumber: number,
  row: number,
  column: number,
  hours: number = 1
): Promise<HistoricalDataPoint[]> {
  // Validate input parameters
  if (!rackNumber || rackNumber < 1) {
    return [];
  }
  
  if (row < 0 || column < 0) {
    return [];
  }
  
  // Build the endpoint with proper parameter formatting
  const endpoint = `/racks/${rackNumber}/locations/${row}/${column}/history`;
  const params = new URLSearchParams({ hours: hours.toString() });
  const fullEndpoint = `${endpoint}?${params}`;
  const fullUrl = `${API_BASE_URL}${fullEndpoint}`;
  
  console.log(`Trend for Rack ${rackNumber}, Row ${row}, Col ${column}, Hours: ${hours}`);
  
  try {
    const data = await apiRequest<HistoricalDataPoint[]>(fullEndpoint);
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data;
  } catch (error) {
    return [];
  }
}

// Fetch specific rack details (GET /racks/{rackId})
export async function fetchRackDetails(rackNumber: number): Promise<RackSummary> {
  return apiRequest<RackSummary>(`/racks/${rackNumber}`);
}

// Fetch last hour of plant history data (GET /racks/{rackId}/locations/{row}/{column}/history?hours=1)
export async function fetchPlantLastHour(
  rackNumber: number,
  row: number,
  column: number
): Promise<HistoricalDataPoint[]> {
  return fetchPlantHistory(rackNumber, row, column, 1);
}

// Debug function to test API connectivity and endpoint availability
export async function debugApiEndpoint(
  rackNumber: number = 1,
  row: number = 0,
  column: number = 0
): Promise<void> {  
  try {
    // Test basic connectivity
    const racks = await fetchRacks();
    
    // Test plant history endpoint
    const history = await fetchPlantHistory(rackNumber, row, column, 1);
    
    if (history.length > 0) {
      console.log(`Sample history data:`, history[0]);
    } else {
      console.log(`No historical data returned - this might indicate:`);
    }
    
  } catch (error) {
    console.error(`API test failed:`, error);
  }
}