import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import type { ChartDataPoint } from "../../lib/plantDetailsHelpers";

interface TrendChartProps {
  chartData: ChartDataPoint[];
  isLoading: boolean;
}

export function TrendChart({ chartData, isLoading }: TrendChartProps) {
  if (chartData.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500">
        {isLoading ? "Loading…" : "No data"}
      </div>
    );
  }

  return (
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
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="moisture"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            name="Moisture"
          />
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
      <ColorHistory chartData={chartData} />
    </div>
  );
}

function ColorHistory({ chartData }: { chartData: ChartDataPoint[] }) {
  if (chartData.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h4 className="mb-3 text-xs font-medium text-slate-600">Plant Color History</h4>
        <div className="flex h-6 items-center justify-center text-xs text-slate-400">
          No color data available
        </div>
      </div>
    );
  }

  return (
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
        <span>Recent history</span>
        <span>{chartData.length} snapshots</span>
      </div>
    </div>
  );
}
