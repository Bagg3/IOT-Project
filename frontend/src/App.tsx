import { useEffect, useMemo, useState } from "react";
import {
  type CellSnapshot,
  type RackSummary
} from "./lib/api";
import { useRacks, useSensorData } from "./hooks";
import { RackGrid } from "./components/RackGrid";
import { Modal } from "./components/ui/modal";
import { ActuatorControls } from "./components/ActuatorControls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Leaf } from "lucide-react";

function RackSelector({
  racks,
  selectedRackId,
  onChange
}: {
  racks: RackSummary[];
  selectedRackId: string | null;
  onChange: (rackId: string) => void;
}) {
  if (!racks.length) {
    return <p className="text-sm text-slate-500">No racks found. Seed the database to begin.</p>;
  }

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-500">Rack</p>
        <Select value={selectedRackId ?? undefined} onValueChange={onChange}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Choose a rack" />
          </SelectTrigger>
          <SelectContent>
            {racks.map((rack) => (
              <SelectItem key={rack.id} value={rack.id}>
                Rack {rack.rack_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [activeCell, setActiveCell] = useState<CellSnapshot | null>(null);

  // Use custom hooks for data fetching
  const racksQuery = useRacks();
  const cellsQuery = useSensorData(selectedRackId);

  useEffect(() => {
    const firstRack = racksQuery.data?.[0];
    if (!firstRack) {
      return;
    }
    setSelectedRackId((previous) => previous ?? firstRack.id);
  }, [racksQuery.data]);

  const selectedRack = useMemo(
    () => racksQuery.data?.find((rack) => rack.id === selectedRackId),
    [racksQuery.data, selectedRackId]
  );

  const cells = cellsQuery.data ?? [];

  useEffect(() => {
    if (!activeCell || !selectedRackId || activeCell.rackId === selectedRackId) {
      return;
    }
    setActiveCell(null);
  }, [selectedRackId, activeCell]);

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
        {/* Rack Selector */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Rack overview</h2>
              <p className="text-sm text-slate-500">Select a rack to inspect live sensor data.</p>
            </div>
            <RackSelector
              racks={racksQuery.data ?? []}
              selectedRackId={selectedRackId}
              onChange={(value) => setSelectedRackId(value)}
            />
          </div>
        </section>

        {/* Rack Grid */}
        <section>
          <RackGrid
            rack={selectedRack}
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
        title={
          activeCell
            ? `Planter R${activeCell.row}C${activeCell.column}`
            : undefined
        }
        description={selectedRack ? `Rack ${selectedRack.rack_number}` : undefined}
      >
        {activeCell ? <ActuatorControls cell={activeCell} onClose={() => setActiveCell(null)} /> : null}
      </Modal>
    </div>
  );
}
