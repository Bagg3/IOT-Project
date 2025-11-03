import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchLatestSensorReadings,
  fetchRacks,
  mapReadingsToCells,
  type CellSnapshot,
  type RackSummary
} from "./lib/api";
import { RackGrid } from "./components/RackGrid";
import { Modal } from "./components/ui/modal";
import { ActuatorControls } from "./components/ActuatorControls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";

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

  const defaultRackId = racks[0]?.id;
  const showReset = Boolean(selectedRackId && defaultRackId && selectedRackId !== defaultRackId);

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
                Rack {rack.rack_number} {rack.farm_name ? `· ${rack.farm_name}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showReset ? (
        <Button
          variant="ghost"
          size="sm"
          className="self-start text-xs text-slate-500 hover:text-slate-700"
          onClick={() => defaultRackId && onChange(defaultRackId)}
        >
          Reset to first rack
        </Button>
      ) : null}
    </div>
  );
}

export default function App() {
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [activeCell, setActiveCell] = useState<CellSnapshot | null>(null);

  const racksQuery = useQuery({ queryKey: ["racks"], queryFn: fetchRacks });

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

  const latestReadingsQuery = useQuery({
    queryKey: ["latest-readings", selectedRackId],
    queryFn: () => fetchLatestSensorReadings(selectedRackId ?? ""),
    enabled: Boolean(selectedRackId),
    refetchInterval: 5000
  });

  const cells = useMemo(
    () => mapReadingsToCells(latestReadingsQuery.data ?? []),
    [latestReadingsQuery.data]
  );

  useEffect(() => {
    if (!activeCell || !selectedRackId || activeCell.rackId === selectedRackId) {
      return;
    }
    setActiveCell(null);
  }, [selectedRackId, activeCell]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">GreenGrow Control Center</h1>
            <p className="text-sm text-slate-600">
              Monitor vertical farm health and orchestrate actuator responses in real time.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <Badge variant="outline">API: {import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api"}</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
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

        <section>
          <RackGrid
            rack={selectedRack}
            cells={cells}
            onSelectCell={setActiveCell}
            isLoading={latestReadingsQuery.isLoading}
            isError={latestReadingsQuery.isError}
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
