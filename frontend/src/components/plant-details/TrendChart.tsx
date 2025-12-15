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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface TrendChartProps {
  chartData: ChartDataPoint[];
  isLoading: boolean;
  timeInterval: number;
  onTimeIntervalChange: (hours: number) => void;
}

export function TrendChart({ chartData, isLoading, timeInterval, onTimeIntervalChange }: TrendChartProps) {
  const getIntervalLabel = () => {
    // Handle minute intervals (fractional hours)
    if (timeInterval < 1) {
      const minutes = Math.round(timeInterval * 60);
      return `Last ${minutes} Minutes`;
    }
    // Handle hour intervals
    if (timeInterval === 1) return "Last Hour";
    if (timeInterval === 24) return "Last Day";
    if (timeInterval === 168) return "Last Week";
    return `Last ${timeInterval} Hours`;
  };

  return (
    <div className="space-y-1">
      <div className='flex items-center justify-between gap-2'>
        <h3 className='text-xs font-semibold text-slate-700 uppercase tracking-wide'>
          {getIntervalLabel()} Trends
        </h3>
        <div className="flex items-center gap-2">
          {isLoading && <span className='text-xs text-slate-500'>Updating</span>}
          <Select
            value={timeInterval.toString()}
            onValueChange={(value) => onTimeIntervalChange(Number(value))}
          >
            <SelectTrigger className="h-7 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1" className="text-xs">1 Hour</SelectItem>
              <SelectItem value="24" className="text-xs">1 Day</SelectItem>
              <SelectItem value="168" className="text-xs">1 Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500">
          {isLoading ? "Loading…" : "No data"}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 3, right: 10, left: 10, bottom: 3 }}>
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
                domain={['auto', 'auto']}
                width={25}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 9 }}
                stroke="#64748b"
                domain={['auto', 'auto']}
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

          <ColorHistory chartData={chartData} />
        </div>
      )}
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
