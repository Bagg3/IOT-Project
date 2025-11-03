import { type CellSnapshot } from "../lib/api";
import { useHistoricalData } from "../hooks/useHistoricalData";
import { Button } from "./ui/button";
import { Droplet, Sun, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ActuatorControlsProps {
  cell: CellSnapshot;
  rackId?: string | null;
}

export default function ActuatorControls({ cell, rackId }: ActuatorControlsProps) {
  const { data: historicalData, isLoading: isHistoryLoading } = useHistoricalData(
    rackId ?? null,
    cell.row,
    cell.column,
    10000 // Poll every 10 seconds
  );

  const handleWaterAction = () => {
    console.log(`[Actuator] Water pump activated for cell at Row ${cell.row}, Col ${cell.column}`);
  };

  const handleLightAction = () => {
    console.log(`[Actuator] Light adjusted for cell at Row ${cell.row}, Col ${cell.column}`);
  };

  // Format data for chart
  const chartData = (historicalData ?? []).map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }),
    moisture: Math.round(point.moisture),
    light: Math.round(point.light)
  }));

  return (
    <div className="space-y-3">
      {/* Control Buttons - Side by Side */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={handleWaterAction}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 py-2"
          size="sm"
        >
          <Droplet className="h-4 w-4" />
          <span className="hidden sm:inline">Water</span>
        </Button>

        <Button
          onClick={handleLightAction}
          className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 py-2"
          size="sm"
        >
          <Sun className="h-4 w-4" />
          <span className="hidden sm:inline">Light</span>
        </Button>
      </div>

      {/* Historical Data Chart */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900">24-Hour Trends</h3>
          <div className="flex items-center gap-2">
            {isHistoryLoading && <span className="text-xs text-slate-500">Updating...</span>}
            <span className="text-xs text-slate-400">Poll 10s</span>
          </div>
        </div>
        {chartData.length > 0 ? (
          <div className="flex justify-center">
            <div className="w-full">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11 }}
                    stroke="#64748b"
                    style={{ overflow: "visible" }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11 }}
                    stroke="#64748b"
                    domain={[20, 90]}
                    width={35}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    stroke="#64748b"
                    domain={[30, 95]}
                    width={35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.5rem",
                      fontSize: "12px"
                    }}
                    formatter={(value) => `${value}%`}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="moisture"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    name="Moisture"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="light"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={false}
                    name="Light"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500">
            {isHistoryLoading ? "Loading historical data…" : "No historical data available"}
          </div>
        )}
      </div>
    </div>
  );
}