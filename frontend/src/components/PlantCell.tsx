import type { CellSnapshot } from "../lib/api";
import { cn } from "../lib/utils";

interface PlantCellProps {
  cell: CellSnapshot;
  onSelect: (cell: CellSnapshot) => void;
}

function getStatusColor(moisturePercent: number | null) {
  if (moisturePercent === null) {
    return "bg-slate-100 border-slate-300 hover:border-slate-400";
  }
  if (moisturePercent < 40) {
    return "bg-orange-100 border-orange-400 hover:border-orange-500";
  }
  if (moisturePercent > 80) {
    return "bg-blue-100 border-blue-400 hover:border-blue-500";
  }
  return "bg-emerald-100 border-emerald-400 hover:border-emerald-500";
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

export function PlantCell({ cell, onSelect }: PlantCellProps) {
  const statusColor = getStatusColor(cell.moisturePercent);

  return (
    <button
      type="button"
      onClick={() => onSelect(cell)}
      className={cn(
        "flex w-full h-full flex-col rounded-lg border-2 bg-white p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-400",
        statusColor
      )}
    >
      {/* Plant Name - Most Visible (Top) */}
      <div className="mb-1.5 flex items-start justify-between gap-1.5">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-slate-900 truncate leading-tight">{cell.display_name || "Unknown"}</div>
          <div className="text-xs text-slate-500 font-normal">{cell.row} x {cell.column}</div>
        </div>
        {cell.color && (
          <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border border-slate-300 shadow-sm" style={{ backgroundColor: cell.color }} />
        )}
      </div>

      {/* Secondary Info at Bottom */}
      <div className="space-y-1 text-xs text-slate-600 mt-auto">
        <div className="flex items-center justify-between gap-2">
          <span>💧</span>
          <span className="font-semibold text-slate-900">{formatPercent(cell.moisturePercent)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>☀️</span>
          <span className="font-semibold text-slate-900">{formatLux(cell.lightPercent)}</span>
        </div>
      </div>
    </button>
  );
}
