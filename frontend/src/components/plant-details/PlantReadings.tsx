import { formatPercent, formatLux } from "../../lib/plantDetailsHelpers";

interface PlantReadingsProps {
  moisturePercent: number | null;
  lightPercent: number | null;
}

export function PlantReadings({ moisturePercent, lightPercent }: PlantReadingsProps) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
        Current Readings
      </h3>
      <div className="space-y-2">
        {/* Moisture Reading */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">💧</span>
            <span className="text-xs text-slate-700">Moisture</span>
          </div>
          <span className="text-lg font-bold text-slate-900">{formatPercent(moisturePercent)}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${Math.max(0, Math.min(100, moisturePercent ?? 0))}%` }}
          />
        </div>

        {/* Light Reading */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">☀️</span>
            <span className="text-xs text-slate-700">Light</span>
          </div>
          <span className="text-lg font-bold text-slate-900">{formatLux(lightPercent)}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className="bg-amber-500 h-1.5 rounded-full transition-all"
            style={{ width: `${Math.max(0, Math.min(100, lightPercent ?? 0))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
