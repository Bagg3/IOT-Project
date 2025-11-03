import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { fetchSensorHistory, type SensorReading } from "../lib/api";
import { parsePercentage } from "../lib/utils";

interface SensorChartProps {
  rackId: string;
  row: number;
  column: number;
  sensorType: string;
  hours?: number;
}

function resolveValue(reading: SensorReading) {
  const candidate = reading.value;
  if (candidate && typeof candidate === "object" && "value" in candidate) {
    return parsePercentage((candidate as { value: unknown }).value);
  }
  return parsePercentage(candidate);
}

function formatTimeLabel(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SensorChart({ rackId, row, column, sensorType, hours = 6 }: SensorChartProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sensor-history", rackId, row, column, sensorType, hours],
    queryFn: () =>
      fetchSensorHistory({
        rack_id: rackId,
        row,
        column,
        sensor_type: sensorType,
        hours
      }),
    refetchInterval: 15000
  });

  const chartData = useMemo(
    () =>
      (data ?? [])
        .map((reading) => ({
          timestamp: reading.timestamp,
          value: resolveValue(reading)
        }))
        .filter((entry) => entry.value !== null),
    [data]
  );

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading history…</p>;
  }

  if (isError) {
    return <p className="text-sm text-red-600">Failed to load sensor history.</p>;
  }

  if (!chartData.length) {
    return <p className="text-sm text-slate-500">No historical readings in the selected window.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimeLabel}
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value: number) => `${Math.round(value)}%`}
            labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2dab62"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
