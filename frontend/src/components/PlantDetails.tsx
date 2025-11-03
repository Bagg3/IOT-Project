import { type CellSnapshot } from "../lib/api";
import { activateWater, adjustLight } from "../lib/actuator";
import { useHistoricalData } from "../hooks/useHistoricalData";
import { Button } from "./ui/button";
import { Droplet, Sun, Check, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";

interface PlantDetailsProps {
  cell: CellSnapshot;
  rackNumber?: number | null;
}

function getStatusColor(moisturePercent: number | null) {
  if (moisturePercent === null) {
    return "bg-slate-100 border-slate-300";
  }
  if (moisturePercent < 40) {
    return "bg-orange-100 border-orange-400";
  }
  if (moisturePercent > 80) {
    return "bg-blue-100 border-blue-400";
  }
  return "bg-emerald-100 border-emerald-400";
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }
  return `${Math.round(value)}%`;
}

function formatLux(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }
  return `${Math.round(value)} lux`;
}

export default function PlantDetails({ cell, rackNumber }: PlantDetailsProps) {
  const [waterStatus, setWaterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lightStatus, setLightStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const { data: historicalData, isLoading: isHistoryLoading } = useHistoricalData(
    rackNumber ?? null,
    cell.row,
    cell.column,
    10000 // Poll every 10 seconds
  );

  const statusColor = getStatusColor(cell.moisturePercent);

  const handleWaterAction = async () => {
    setWaterStatus("loading");
    try {
      const response = await activateWater(rackNumber ?? 1, cell.row, cell.column);
      if (response.success) {
        setWaterStatus("success");
        setTimeout(() => setWaterStatus("idle"), 2000);
      } else {
        setWaterStatus("error");
        setTimeout(() => setWaterStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("[UI] Water action failed:", error);
      setWaterStatus("error");
      setTimeout(() => setWaterStatus("idle"), 2000);
    }
  };

  const handleLightAction = async () => {
    setLightStatus("loading");
    try {
      const response = await adjustLight(rackNumber ?? 1, cell.row, cell.column);
      if (response.success) {
        setLightStatus("success");
        setTimeout(() => setLightStatus("idle"), 2000);
      } else {
        setLightStatus("error");
        setTimeout(() => setLightStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("[UI] Light action failed:", error);
      setLightStatus("error");
      setTimeout(() => setLightStatus("idle"), 2000);
    }
  };

  // Format data for chart
  const chartData = (historicalData ?? []).map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }),
    moisture: Math.round(point.moisture),
    light: Math.round(point.light),
    color: point.color
  }));

  return (
    <div className="space-y-3">
      {/* Current Readings + Actions Combined Section */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2">
        {/* Current Readings */}
        <div>
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Current Readings</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">💧</span>
                <span className="text-xs text-slate-700">Moisture</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{formatPercent(cell.moisturePercent)}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.max(0, Math.min(100, cell.moisturePercent ?? 0))}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">☀️</span>
                <span className="text-xs text-slate-700">Light</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{formatLux(cell.lightPercent)}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.max(0, Math.min(100, cell.lightPercent ?? 0))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions - Integrated */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
          <Button
            onClick={handleWaterAction}
            disabled={waterStatus === "loading"}
            className={`flex items-center justify-center gap-1.5 py-1.5 transition-colors ${
              waterStatus === "success"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : waterStatus === "error"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
            }`}
            size="sm"
          >
            {waterStatus === "loading" ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span className="text-xs">Watering…</span>
              </>
            ) : waterStatus === "success" ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span className="text-xs">Watered!</span>
              </>
            ) : waterStatus === "error" ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span className="text-xs">Failed</span>
              </>
            ) : (
              <>
                <Droplet className="h-3.5 w-3.5" />
                <span className="text-xs">Water</span>
              </>
            )}
          </Button>

          <Button
            onClick={handleLightAction}
            disabled={lightStatus === "loading"}
            className={`flex items-center justify-center gap-1.5 py-1.5 transition-colors ${
              lightStatus === "success"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : lightStatus === "error"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-amber-600 hover:bg-amber-700"
            }`}
            size="sm"
          >
            {lightStatus === "loading" ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span className="text-xs">Adjusting…</span>
              </>
            ) : lightStatus === "success" ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span className="text-xs">Adjusted!</span>
              </>
            ) : lightStatus === "error" ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span className="text-xs">Failed</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5" />
                <span className="text-xs">Light</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Historical Data Chart - Bigger */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">24-Hour Trends</h3>
          {isHistoryLoading && <span className="text-xs text-slate-500">Updating…</span>}
        </div>
        {chartData.length > 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 3, right: 15, left: -10, bottom: 3 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9 }}
                  stroke="#64748b"
                  style={{ overflow: "visible" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 9 }}
                  stroke="#64748b"
                  domain={[20, 90]}
                  width={25}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 9 }}
                  stroke="#64748b"
                  domain={[30, 95]}
                  width={25}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.375rem",
                    fontSize: "11px"
                  }}
                  formatter={(value, name) => {
                    if (name === "Light") {
                      return `${value} lux`;
                    }
                    return `${value}%`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }} />
                {/* Moisture line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="moisture"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={false}
                  name="Moisture"
                />
                {/* Light line */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="light"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  name="Light"
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Color History Visualization */}
            {chartData.length > 0 && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-xs font-medium text-slate-600">Plant Color History</h4>
                <div className="flex gap-1">
                  {chartData.map((point, index) => {
                    const color = point.color || "#94a3b8";
                    return (
                      <div
                        key={index}
                        className="flex-1 cursor-pointer rounded-sm transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          height: "24px",
                          border: "1px solid rgba(0, 0, 0, 0.1)"
                        }}
                        title={`${point.time}: ${point.color || "No data"}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>24 hours</span>
                  <span>Hourly snapshots</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500">
            {isHistoryLoading ? "Loading…" : "No data"}
          </div>
        )}
      </div>
    </div>
  );
}