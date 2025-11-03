import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  fetchLatestSensorReadings,
  mapReadingsToCells,
  type CellSnapshot,
  type Plant
} from "../lib/api";

/**
 * Hook for fetching real-time sensor data with configurable polling interval
 * Fetches latest sensor readings from all plants in a rack
 * Default polling interval: 5 seconds (5000ms)
 */
export function useSensorData(
  rackNumber: number | null,
  pollInterval: number = 5000
): UseQueryResult<CellSnapshot[]> {
  return useQuery({
    queryKey: ["sensor-data", rackNumber],
    queryFn: async () => {
      if (rackNumber === null) {
        return [];
      }
      const readings = await fetchLatestSensorReadings(rackNumber);
      return mapReadingsToCells(readings);
    },
    enabled: rackNumber !== null,
    refetchInterval: pollInterval,
    staleTime: pollInterval / 2,
    placeholderData: (previousData) => previousData
  });
}

/**
 * Hook for fetching raw sensor readings (unprocessed)
 * Useful when you need the raw reading data before mapping to cells
 * Default polling interval: 5 seconds
 */
export function useRawSensorReadings(
  rackNumber: number | null,
  pollInterval: number = 5000
): UseQueryResult<Plant[]> {
  return useQuery({
    queryKey: ["raw-sensor-readings", rackNumber],
    queryFn: async () => {
      if (rackNumber === null) {
        return [];
      }
      return await fetchLatestSensorReadings(rackNumber);
    },
    enabled: rackNumber !== null,
    refetchInterval: pollInterval,
    staleTime: pollInterval / 2,
    placeholderData: (previousData) => previousData
  });
}

/**
 * Aggregated data for a single cell - useful for detailed cell views
 */
export interface CellMetrics {
  cell: CellSnapshot;
  lastUpdated: string;
}

/**
 * Hook to get aggregated metrics for a specific cell
 */
/**
 * Hook for fetching cell-specific metrics
 * Default polling interval: 5 seconds
 */
export function useCellMetrics(
  cell: CellSnapshot | null,
  rackNumber: number | null,
  pollInterval: number = 5000
): UseQueryResult<CellMetrics | null> {
  return useQuery({
    queryKey: ["cell-metrics", rackNumber, cell?.row, cell?.column],
    queryFn: async () => {
      if (!cell || rackNumber === null) {
        return null;
      }
      return {
        cell,
        lastUpdated: new Date().toISOString()
      };
    },
    enabled: cell !== null && rackNumber !== null,
    refetchInterval: pollInterval,
    staleTime: pollInterval / 2,
    placeholderData: (previousData) => previousData
  });
}
