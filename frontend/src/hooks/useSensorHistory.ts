import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchSensorHistory, type SensorReading } from "../lib/api";
import { parsePercentage } from "../lib/utils";

export interface SensorHistoryPoint {
  timestamp: string;
  value: number | null;
  rawReading: SensorReading;
}

/**
 * Hook for fetching historical sensor data for charting
 * Returns processed data points with parsed numeric values
 * Polling is disabled - data loads once and stays in cache
 */
export function useSensorHistory(
  rackId: string | null,
  row: number,
  column: number,
  sensorType: string,
  hours = 6
): UseQueryResult<SensorHistoryPoint[]> {
  return useQuery({
    queryKey: ["sensor-history", rackId, row, column, sensorType, hours],
    queryFn: async () => {
      if (!rackId) {
        return [];
      }

      const readings = await fetchSensorHistory({
        rack_id: rackId,
        row,
        column,
        sensor_type: sensorType,
        hours
      });

      return readings.map((reading) => {
        const numericValue = extractReadingValue(reading);
        return {
          timestamp: reading.timestamp,
          value: parsePercentage(numericValue),
          rawReading: reading
        };
      });
    },
    enabled: Boolean(rackId),
    refetchInterval: false,
    staleTime: Infinity
  });
}

/**
 * Hook to fetch and aggregate statistics for a sensor over a time period
 */
export interface SensorStatistics {
  min: number | null;
  max: number | null;
  avg: number | null;
  latest: number | null;
  readings: SensorHistoryPoint[];
}

export function useSensorStatistics(
  rackId: string | null,
  row: number,
  column: number,
  sensorType: string,
  hours = 6
): UseQueryResult<SensorStatistics | null> {
  const historyQuery = useSensorHistory(rackId, row, column, sensorType, hours);

  return useQuery({
    queryKey: ["sensor-statistics", rackId, row, column, sensorType, hours],
    queryFn: () => {
      if (!historyQuery.data) {
        return null;
      }

      const validReadings = historyQuery.data.filter((point) => point.value !== null);

      if (validReadings.length === 0) {
        return {
          min: null,
          max: null,
          avg: null,
          latest: null,
          readings: historyQuery.data
        };
      }

      const values = validReadings.map((point) => point.value as number);
      const sum = values.reduce((acc, val) => acc + val, 0);

      return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: sum / values.length,
        latest: validReadings[validReadings.length - 1]?.value ?? null,
        readings: historyQuery.data
      };
    },
    enabled: historyQuery.isSuccess,
    staleTime: Number.POSITIVE_INFINITY, // Derived data
    placeholderData: (previousData) => previousData
  });
}

function extractReadingValue(reading: SensorReading): unknown {
  const candidate = reading.value;
  if (candidate && typeof candidate === "object" && "value" in candidate) {
    return (candidate as { value: unknown }).value;
  }
  return candidate;
}
