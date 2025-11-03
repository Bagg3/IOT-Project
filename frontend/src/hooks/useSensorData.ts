import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  fetchLatestSensorReadings,
  mapReadingsToCells,
  type CellSnapshot,
  type Plant,
  type SensorReading
} from "../lib/api";

/**
 * Hook for fetching real-time sensor data with configurable polling interval
 * Fetches latest sensor readings from all plants in a rack
 * Default polling interval: 5 seconds (5000ms)
 */
export function useSensorData(
  rackId: string | null,
  pollInterval: number = 5000
): UseQueryResult<CellSnapshot[]> {
  return useQuery({
    queryKey: ["sensor-data", rackId],
    queryFn: async () => {
      if (!rackId) {
        return [];
      }
      const readings = await fetchLatestSensorReadings(rackId);
      return mapReadingsToCells(readings);
    },
    enabled: Boolean(rackId),
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
  rackId: string | null,
  pollInterval: number = 5000
): UseQueryResult<Plant[]> {
  return useQuery({
    queryKey: ["raw-sensor-readings", rackId],
    queryFn: async () => {
      if (!rackId) {
        return [];
      }
      return await fetchLatestSensorReadings(rackId);
    },
    enabled: Boolean(rackId),
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
  rackId: string | null,
  pollInterval: number = 5000
): UseQueryResult<CellMetrics | null> {
  return useQuery({
    queryKey: ["cell-metrics", rackId, cell?.row, cell?.column],
    queryFn: async () => {
      if (!cell || !rackId) {
        return null;
      }
      return {
        cell,
        lastUpdated: new Date().toISOString()
      };
    },
    enabled: Boolean(cell && rackId),
    refetchInterval: pollInterval,
    staleTime: pollInterval / 2,
    placeholderData: (previousData) => previousData
  });
}
