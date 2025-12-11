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
 * Fetch historical data for a specific plant location (last hour)
 * GET /racks/{rackId}/locations/{row}/{column}/history?hours=1
 * 
 * @param rackNumber - The rack number
 * @param row - Plant row position
 * @param column - Plant column position
 * @param hours - Number of hours of history to fetch (default: 1 for last hour)
 */
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

/**
 * Fetch specific rack details (optional - if you need rack metadata)
 * GET /racks/{rackId}
 */
export async function fetchRackDetails(rackNumber: number): Promise<RackSummary> {
  return apiRequest<RackSummary>(`/racks/${rackNumber}`);
}

/**
 * Convenience function to fetch last hour of plant history data
 * GET /racks/{rackId}/locations/{row}/{column}/history?hours=1
 */
export async function fetchPlantLastHour(
  rackNumber: number,
  row: number,
  column: number
): Promise<HistoricalDataPoint[]> {
  return fetchPlantHistory(rackNumber, row, column, 1);
}

/**
 * Debug function to test API connectivity and endpoint availability
 * Use this in the browser console to test if the API is working
 */
export async function debugApiEndpoint(
  rackNumber: number = 1,
  row: number = 0,
  column: number = 0
): Promise<void> {
  console.log(`[DEBUG] Testing API connectivity...`);
  console.log(`[DEBUG] API Base URL: ${API_BASE_URL}`);
  
  try {
    // Test basic connectivity
    console.log(`[DEBUG] 1. Testing basic API connectivity with /racks endpoint...`);
    const racks = await fetchRacks();
    console.log(`[DEBUG] ✅ Basic API connection successful. Found ${racks.length} racks:`, racks);
    
    // Test plant history endpoint
    console.log(`[DEBUG] 2. Testing plant history endpoint...`);
    const history = await fetchPlantHistory(rackNumber, row, column, 1);
    console.log(`[DEBUG] ✅ Plant history request completed. Data points: ${history.length}`);
    
    if (history.length > 0) {
      console.log(`[DEBUG] Sample history data:`, history[0]);
    } else {
      console.log(`[DEBUG] ⚠️ No historical data returned - this might indicate:`);
      console.log(`[DEBUG]    - No data exists for Rack ${rackNumber}, Row ${row}, Col ${column}`);
      console.log(`[DEBUG]    - Backend endpoint expects different parameter format`);
      console.log(`[DEBUG]    - Row/column indexing mismatch (try 1-based indexing)`);
    }
    
  } catch (error) {
    console.error(`[DEBUG] ❌ API test failed:`, error);
    console.log(`[DEBUG] Troubleshooting steps:`);
    console.log(`[DEBUG] 1. Check if backend server is running`);
    console.log(`[DEBUG] 2. Verify VITE_API_BASE_URL in .env.local: ${API_BASE_URL}`);
    console.log(`[DEBUG] 3. Check browser network tab for failed requests`);
    console.log(`[DEBUG] 4. Verify CORS configuration on backend`);
  }
}