import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchPlantHistory, type HistoricalDataPoint } from "../lib";

/**
 * Hook for fetching historical sensor data for a plant cell
 * Returns historical data from the backend API
 * Default polling interval: 10 seconds (10000ms) to show trending updates
 */
export function useHistoricalData(
  rackNumber: number | null,
  row: number | null,
  column: number | null,
  hours: number = 1,
  pollInterval: number = 10000
): UseQueryResult<HistoricalDataPoint[]> {
  return useQuery({
    queryKey: ["historical-data", rackNumber, row, column, hours],
    queryFn: async () => {
      if (rackNumber === null || row === null || column === null) {
        return [];
      }
      
      try {
        const data = await fetchPlantHistory(rackNumber, row, column, hours);
        
        // Validate the data structure
        if (Array.isArray(data)) {
          const validatedData = data.filter(point => 
            point && 
            typeof point.timestamp === 'string' && 
            typeof point.moisture === 'number' && 
            typeof point.light === 'number'
          );
          
          return validatedData;
        }
        
        return [];
      } catch (error) {
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
