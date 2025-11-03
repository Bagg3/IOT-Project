import type { CellSnapshot, RackSummary } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PlantCell } from "./PlantCell";
import { Badge } from "./ui/badge";

interface RackGridProps {
  rack?: RackSummary;
  cells: CellSnapshot[];
  onSelectCell: (cell: CellSnapshot) => void;
  isLoading: boolean;
  isError: boolean;
}

export function RackGrid({ rack, cells, onSelectCell, isLoading, isError }: RackGridProps) {
  if (!rack) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No racks provisioned</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-600">
          Add a rack in the backend to begin monitoring sensors.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
          <CardTitle>Rack {rack.rack_number}</CardTitle>
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">
              {rack.rows}×{rack.columns} cells
            </p>
            <Badge variant="outline" className="text-xs">
              {isLoading ? "Updating..." : "Polling 5s"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6 pt-6">
        {isError ? (
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            Unable to load sensor readings. Check the gateway connection.
          </div>
        ) : null}
        {isLoading && !cells.length ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            Loading sensor data…
          </div>
        ) : cells.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            No plants in this rack.
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(200px, 1fr))` }}
          >
            {cells.map((cell) => (
              <PlantCell
                key={`${cell.row}:${cell.column}`}
                cell={cell}
                onSelect={onSelectCell}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
