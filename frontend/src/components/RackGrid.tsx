import type { CellSnapshot, RackSummary } from "../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PlantCell } from "./PlantCell";

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

  const cellMap = new Map<string, CellSnapshot>();
  cells.forEach((cell) => cellMap.set(`${cell.row}:${cell.column}`, cell));

  const totalCells = rack.rows * rack.columns;
  const gridTemplateColumns = `repeat(${rack.columns}, minmax(0, 1fr))`;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
          <CardTitle>Rack {rack.rack_number}</CardTitle>
          <p className="text-sm text-slate-500">
            {rack.farm_name ? `${rack.farm_name} · ` : ""}
            {rack.rows}×{rack.columns} cells
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6 pt-6">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            Loading sensor data…
          </div>
        ) : null}
        {isError ? (
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            Unable to load sensor readings. Check the gateway connection.
          </div>
        ) : null}
        {!isLoading ? (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns }}
          >
            {Array.from({ length: totalCells }, (_, index) => {
              const row = Math.floor(index / rack.columns) + 1;
              const column = (index % rack.columns) + 1;
              const key = `${row}:${column}`;
              const cell =
                cellMap.get(key) ?? {
                  rackId: rack.id,
                  row,
                  column,
                  sensors: {},
                  moisturePercent: null,
                  lightPercent: null
                };
              return (
                <PlantCell
                  key={key}
                  cell={cell}
                  onSelect={onSelectCell}
                />
              );
            })}
          </div>
        ) : null}
        {!isLoading && !cells.length ? (
          <p className="text-sm text-slate-500">
            Waiting for the first sensor readings to arrive.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
