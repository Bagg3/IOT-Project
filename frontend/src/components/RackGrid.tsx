import type { CellSnapshot, RackSummary } from "../lib";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PlantCell } from "./PlantCell";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface RackGridProps {
  racks: RackSummary[];
  rack?: RackSummary;
  selectedRackNumber: number | null;
  onSelectRack: (rackNumber: number) => void;
  cells: CellSnapshot[];
  onSelectCell: (cell: CellSnapshot) => void;
  isLoading: boolean;
  isError: boolean;
}

export function RackGrid({ racks, rack, selectedRackNumber, onSelectRack, cells, onSelectCell, isLoading, isError }: RackGridProps) {
  if (!racks.length) {
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-xs uppercase tracking-wide text-slate-500">Rack</div>
            <Select value={selectedRackNumber?.toString() ?? undefined} onValueChange={(value) => onSelectRack(parseInt(value, 10))}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Choose a rack" />
              </SelectTrigger>
              <SelectContent>
                {racks.map((r) => (
                  <SelectItem key={r.rack_number} value={r.rack_number.toString()}>
                    Rack {r.rack_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {rack && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-500">
                {rack.rows}×{rack.columns} cells
              </p>
              <Badge variant="outline" className="text-xs">
                {isLoading ? "Updating..." : "Polling 5s"}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        {isError ? (
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            Unable to load sensor readings. Check the gateway connection.
          </div>
        ) : null}
        {!rack ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            Select a rack to view plants
          </div>
        ) : isLoading && !cells.length ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            Loading sensor data…
          </div>
        ) : cells.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            No plants in this rack.
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div
              className="grid gap-2 flex-1"
              style={{ gridTemplateColumns: `repeat(${rack.columns}, 1fr)`, gridTemplateRows: `repeat(${rack.rows}, 1fr)` }}
            >
              {Array.from({ length: rack.rows }).map((_, rowIndex) =>
                Array.from({ length: rack.columns }).map((_, colIndex) => {
                  const row = rowIndex + 1;
                  const column = colIndex + 1;
                  const cell = cells.find((c) => c.row === row && c.column === column);
                  return (
                    <div key={`${row}:${column}`} className="min-h-0">
                      {cell ? (
                        <PlantCell cell={cell} onSelect={onSelectCell} />
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-400">
                          R{row}C{column}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
