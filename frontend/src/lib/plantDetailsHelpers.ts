/**
 * Helper functions and utilities for plant details display
 */

export function getStatusColor(moisturePercent: number | null): string {
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

export function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }
  return `${Math.round(value)}%`;
}

export function formatLux(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }
  return `${Math.round(value)} lux`;
}

export interface ChartDataPoint {
  time: string;
  moisture: number;
  light: number;
  color: string | null;
}

export function formatHistoricalData(
  historicalData: Array<{ timestamp: string; moisture: number; light: number; color: string | null }>
): ChartDataPoint[] {
  return historicalData.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }),
    moisture: Math.round(point.moisture),
    light: Math.round(point.light),
    color: point.color
  }));
}
