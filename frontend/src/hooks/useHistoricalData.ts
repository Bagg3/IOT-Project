import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchPlantHistory, type HistoricalDataPoint } from "../lib/api";

/**
 * Hook for fetching historical sensor data for a plant cell
 * Returns 24 hours of historical data with 1-hour intervals
 * Default polling interval: 10 seconds (10000ms) to show trending updates
 */
export function useHistoricalData(
  rackId: string | null,
  row: number | null,
  column: number | null,
  pollInterval: number = 10000
): UseQueryResult<HistoricalDataPoint[]> {
  return useQuery({
    queryKey: ["historical-data", rackId, row, column],
    queryFn: async () => {
      if (!rackId || row === null || column === null) {
        return [];
      }
      return await fetchPlantHistory(rackId, row, column);
    },
    enabled: Boolean(rackId && row !== null && column !== null),
    refetchInterval: pollInterval,
    staleTime: pollInterval / 2,
    placeholderData: (previousData) => previousData
  });
}
