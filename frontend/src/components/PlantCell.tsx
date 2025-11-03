import type { CellSnapshot } from "../lib/api";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";

interface PlantCellProps {
  cell: CellSnapshot;
  onSelect: (cell: CellSnapshot) => void;
}

function getMoistureStatus(moisturePercent: number | null) {
  if (moisturePercent === null) {
    return { label: "No data", variant: "outline" as const, tone: "bg-slate-100" };
  }
  if (moisturePercent < 30) {
    return { label: "Dry", variant: "critical" as const, tone: "bg-red-50" };
  }
  if (moisturePercent < 50) {
    return { label: "Watch", variant: "warning" as const, tone: "bg-yellow-50" };
  }
  if (moisturePercent > 80) {
    return { label: "Soggy", variant: "warning" as const, tone: "bg-blue-50" };
  }
  return { label: "Optimal", variant: "default" as const, tone: "bg-emerald-50" };
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }
  return `${Math.round(value)}%`;
}

export function PlantCell({ cell, onSelect }: PlantCellProps) {
  const status = getMoistureStatus(cell.moisturePercent);

  return (
    <button
      type="button"
      onClick={() => onSelect(cell)}
      className={cn(
        "flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-400",
        status.tone
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">{cell.display_name || "Unknown"}</div>
            <div className="text-xs text-slate-500">
              Row {cell.row} · Col {cell.column}
            </div>
          </div>
          {cell.color && (
            <div className="h-6 w-6 rounded-lg border border-slate-200 shadow-sm" style={{ backgroundColor: cell.color }} />
          )}
        </div>
        {cell.planted_at && <div className="text-xs text-slate-500">Planted: {new Date(cell.planted_at).toLocaleDateString()}</div>}
        <Badge variant={status.variant} className="w-fit">
          {status.label}
        </Badge>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-700">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-600">Moisture</span>
          <span className="font-semibold text-slate-900">{formatPercent(cell.moisturePercent)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-600">Light</span>
          <span className="font-semibold text-slate-900">{formatPercent(cell.lightPercent)}</span>
        </div>
      </div>
    </button>
  );
}
