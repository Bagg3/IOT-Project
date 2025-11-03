import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchPlantHistory, type HistoricalDataPoint } from "../lib/api";

/**
 * Hook for fetching historical sensor data for a plant cell
 * Returns 5 minutes of historical data with frequent intervals
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
        return [];
      }
      // Request 5 minutes of historical data (5/60 = 0.083 hours)
      return await fetchPlantHistory(rackNumber, row, column, 5 / 60);
    },
    enabled: rackNumber !== null && row !== null && column !== null,
    refetchInterval: pollInterval,
    staleTime: pollInterval / 2,
    placeholderData: (previousData) => previousData
  });
}
