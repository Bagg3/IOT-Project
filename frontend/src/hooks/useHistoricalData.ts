import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchPlantHistory, type HistoricalDataPoint } from "../lib";

/**
 * Hook for fetching historical sensor data for a plant cell
 * Returns last hour of historical data from the backend API
 * Default polling interval: 10 seconds (10000ms) to show trending updates
 */
export function useHistoricalData(
  rackNumber: number | null,
  row: number | null,
  column: number | null,
  pollInterval: number = 10000
): UseQueryResult<HistoricalDataPoint[]> {
  return useQuery({
    queryKey: ["historical-data", rackNumber, row, column],
    queryFn: async () => {
      if (rackNumber === null || row === null || column === null) {
        console.log('[Hook] Historical data query skipped - missing parameters');
        return [];
      }
      
      console.log(`[Hook] Fetching last hour of historical data for Rack ${rackNumber}, Row ${row}, Col ${column}`);
      
      // Request exactly 1 hour of data as specified
      const hours = 1;
      
      try {
        const data = await fetchPlantHistory(rackNumber, row, column, hours);
        console.log(`[Hook] Historical data received: ${data.length} points for last ${hours} hour(s)`);
        
        // Validate the data structure
        if (Array.isArray(data)) {
          const validatedData = data.filter(point => 
            point && 
            typeof point.timestamp === 'string' && 
            typeof point.moisture === 'number' && 
            typeof point.light === 'number'
          );
          
          if (validatedData.length !== data.length) {
            console.warn(`[Hook] Filtered ${data.length - validatedData.length} invalid data points`);
          }
          
          return validatedData;
        }
        
        console.warn('[Hook] Received non-array data:', data);
        return [];
      } catch (error) {
        console.error(`[Hook] Historical data fetch failed:`, error);
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }
    },
    enabled: rackNumber !== null && row !== null && column !== null,
    refetchInterval: pollInterval,
    staleTime: pollInterval / 2,
    placeholderData: (previousData) => previousData,
    retry: 3,
    retryDelay: 1000
  });
}
