import { useSensorStatistics } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Activity } from "lucide-react";

interface SensorMetricsProps {
  rackId: string | null;
  row: number;
  column: number;
  sensorType: string;
  hours?: number;
}

function formatValue(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return `${Math.round(value)}%`;
}

function getStatusColor(
  value: number | null,
  type: "moisture" | "light" | "temperature"
): "default" | "critical" | "warning" {
  if (value === null) return "default";

  if (type === "moisture") {
    if (value < 30) return "critical";
    if (value < 50 || value > 80) return "warning";
    return "default";
  }

  if (type === "light") {
    if (value < 20) return "warning";
    return "default";
  }

  return "default";
}

/**
 * Display aggregated sensor statistics (min, max, avg, latest)
 * with color-coded status indicators
 */
export function SensorMetrics({
  rackId,
  row,
  column,
  sensorType,
  hours = 6
}: SensorMetricsProps) {
  const { data: stats, isLoading, isError } = useSensorStatistics(
    rackId,
    row,
    column,
    sensorType,
    hours
  );

  const sensorTypeKey = (
    sensorType.toLowerCase().includes("moisture")
      ? "moisture"
      : sensorType.toLowerCase().includes("light")
        ? "light"
        : "temperature"
  ) as "moisture" | "light" | "temperature";

  const statusColor = getStatusColor(stats?.latest ?? null, sensorTypeKey);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            {sensorType.replace(/_/g, " ").toUpperCase()}
          </CardTitle>
          <Badge variant={statusColor} className="text-xs">
            {stats?.latest !== null ? "Active" : "No Data"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-slate-500">Loading metrics…</div>
        ) : isError ? (
          <div className="text-sm text-red-600">Failed to load metrics</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Latest
              </span>
              <span className="mt-2 text-2xl font-bold text-slate-900">
                {formatValue(stats?.latest ?? null)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Average
              </span>
              <span className="mt-2 text-2xl font-bold text-slate-700">
                {formatValue(stats?.avg ?? null)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Min
              </span>
              <span className="mt-2 text-2xl font-bold text-blue-600">
                {formatValue(stats?.min ?? null)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Max
              </span>
              <span className="mt-2 text-2xl font-bold text-red-600">
                {formatValue(stats?.max ?? null)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
