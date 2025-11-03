import { useEffect, useMemo, useState } from "react";
import {
  type CellSnapshot,
  type RackSummary
} from "./lib/api";
import { useRacks, useSensorData } from "./hooks";
import { RackGrid } from "./components/RackGrid";
import { Modal } from "./components/ui/modal";
import PlantDetails from "./components/PlantDetails";
import { Badge } from "./components/ui/badge";
import { Leaf } from "lucide-react";

export default function App() {
  const [selectedRackNumber, setSelectedRackNumber] = useState<number | null>(null);
  const [activeCell, setActiveCell] = useState<CellSnapshot | null>(null);

  // Use custom hooks for data fetching
  const racksQuery = useRacks();
  const cellsQuery = useSensorData(selectedRackNumber);

  useEffect(() => {
    const firstRack = racksQuery.data?.[0];
    if (!firstRack) {
      return;
    }
    setSelectedRackNumber((previous) => previous ?? firstRack.rack_number);
  }, [racksQuery.data]);

  const selectedRack = useMemo(
    () => racksQuery.data?.find((rack) => rack.rack_number === selectedRackNumber),
    [racksQuery.data, selectedRackNumber]
  );

  const cells = cellsQuery.data ?? [];

  useEffect(() => {
    if (!activeCell || !selectedRackNumber || activeCell.rack_number === selectedRackNumber) {
      return;
    }
    setActiveCell(null);
  }, [selectedRackNumber, activeCell]);

  // Sync activeCell with updated sensor data
  useEffect(() => {
    if (!activeCell) {
      return;
    }
    const updatedCell = cells.find(
      (cell) => cell.row === activeCell.row && cell.column === activeCell.column
    );
    if (updatedCell) {
      setActiveCell(updatedCell);
    }
  }, [cells]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">GreenGrow</h1>
              <p className="text-xs text-slate-500">Real-time IoT Dashboard</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <Badge variant="outline">
              API: {import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">
        {/* Rack Grid */}
        <section>
          <RackGrid
            racks={racksQuery.data ?? []}
            rack={selectedRack}
            selectedRackNumber={selectedRackNumber}
            onSelectRack={setSelectedRackNumber}
            cells={cells}
            onSelectCell={setActiveCell}
            isLoading={cellsQuery.isLoading}
            isError={cellsQuery.isError}
          />
        </section>
      </main>

      <Modal
        open={Boolean(activeCell)}
        onClose={() => setActiveCell(null)}
        title={activeCell?.display_name || undefined}
        description={
          activeCell
            ? `Rack ${selectedRack?.rack_number} · Row ${activeCell.row} · Col ${activeCell.column} ${activeCell.planted_at ? ` · Planted ${new Date(activeCell.planted_at).toLocaleDateString()}` : ""}`
            : undefined
        }
      >
        {activeCell ? <PlantDetails cell={activeCell} rackNumber={selectedRackNumber} /> : null}
      </Modal>
    </div>
  );
}
