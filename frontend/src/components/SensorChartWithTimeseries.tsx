import { useMemo } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useSensorHistory } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface SensorChartWithTimeseriesProps {
  rackId: string | null;
  row: number;
  column: number;
  sensorType: string;
  hours?: number;
  title?: string;
}

function formatTimeLabel(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Enhanced sensor chart component showing real-time time series data
 * Uses the useSensorHistory hook for automatic polling and caching
 */
export function SensorChartWithTimeseries({
  rackId,
  row,
  column,
  sensorType,
  hours = 6,
  title
}: SensorChartWithTimeseriesProps) {
  const { data: history, isLoading, isError } = useSensorHistory(
    rackId,
    row,
    column,
    sensorType,
    hours
  );

  const chartData = useMemo(
    () =>
      history
        ?.filter((point) => point.value !== null)
        .map((point) => ({
          timestamp: point.timestamp,
          value: point.value
        })) ?? [],
    [history]
  );

  const sensorLabel = sensorType.replace(/_/g, " ").toUpperCase();
  const defaultTitle = title || `${sensorLabel} History (${hours}h)`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{defaultTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-500">
            Loading historical data…
          </div>
        ) : isError ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-sm text-red-600">
            Failed to load sensor history
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-500">
            No historical data available
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 16, left: -16, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimeLabel}
                  stroke="#64748b"
                  fontSize={12}
                  tick={{ fill: "#64748b" }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#64748b"
                  fontSize={12}
                  tick={{ fill: "#64748b" }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${Math.round(value)}%`, sensorLabel]}
                  labelFormatter={(timestamp) =>
                    new Date(timestamp).toLocaleString()
                  }
                  contentStyle={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem"
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name={sensorLabel}
                  stroke="#2dab62"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
