import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Droplet, Loader2, SunMedium } from "lucide-react";
import { postActuatorCommand, type CellSnapshot } from "../lib/api";
import { parsePercentage } from "../lib/utils";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { SensorChart } from "./SensorChart";

interface ActuatorControlsProps {
  cell: CellSnapshot;
  onClose: () => void;
}

type FeedbackState = {
  status: "success" | "error";
  message: string;
};

function findReading(cell: CellSnapshot, keyword: string) {
  const entry = Object.entries(cell.sensors).find(([type]) =>
    type.toLowerCase().includes(keyword.toLowerCase())
  );
  return entry ? entry[1] : undefined;
}

function formatValue(reading?: CellSnapshot["sensors"][string]) {
  if (!reading) {
    return "--";
  }
  const value = parsePercentage((reading.value as { value?: unknown })?.value ?? reading.value);
  const unit =
    typeof reading.value === "object" && reading.value !== null && "unit" in reading.value
      ? String((reading.value as { unit?: unknown }).unit ?? "")
      : "%";
  if (value === null) {
    return "--";
  }
  return `${Math.round(value)}${unit}`;
}

export function ActuatorControls({ cell, onClose }: ActuatorControlsProps) {
  const [lightLevel, setLightLevel] = useState(() => Math.round(cell.lightPercent ?? 60));
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const mutation = useMutation({
    mutationFn: postActuatorCommand,
    onSuccess: (_, variables) => {
      const action = variables.actuator_type === "water_pump" ? "Water" : "Light";
      setFeedback({ status: "success", message: `${action} command dispatched successfully.` });
    },
    onError: (error: unknown) => {
      setFeedback({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to send command. Please try again."
      });
    }
  });

  const moistureReading = findReading(cell, "moisture");
  const lightReading = findReading(cell, "light");

  const sendWaterCommand = async () => {
    setFeedback(null);
    await mutation.mutateAsync({
      rack_id: cell.rackId,
      row: cell.row,
      column: cell.column,
      actuator_type: "water_pump",
      action: "water",
      parameters: {
        duration_seconds: 10
      }
    });
  };

  const sendLightCommand = async () => {
    setFeedback(null);
    await mutation.mutateAsync({
      rack_id: cell.rackId,
      row: cell.row,
      column: cell.column,
      actuator_type: "lamp",
      action: "set_intensity",
      parameters: {
        intensity: lightLevel
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">
          Rack {cell.rackId.slice(0, 8)} · Row {cell.row} · Column {cell.column}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <Droplet className="h-4 w-4 text-brand-500" />
            Moisture
          </span>
          <Badge>{formatValue(moistureReading)}</Badge>
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <SunMedium className="h-4 w-4 text-amber-500" />
            Light
          </span>
          <Badge variant="outline">{formatValue(lightReading)}</Badge>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Watering</h3>
            <p className="text-sm text-slate-500">
              Dispatch a water pulse. The simulator treats this as 10 seconds of irrigation.
            </p>
          </div>
          <Button
            onClick={sendWaterCommand}
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Droplet className="h-4 w-4" />}
            Water plant
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Light intensity</h3>
            <p className="text-sm text-slate-500">Set desired light output for this planter.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium uppercase text-slate-500">
              <Label htmlFor="light-level">Intensity</Label>
              <span>{lightLevel}%</span>
            </div>
            <input
              id="light-level"
              type="range"
              min={0}
              max={100}
              value={lightLevel}
              onChange={(event) => setLightLevel(Number.parseInt(event.currentTarget.value, 10))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-500"
            />
          </div>
          <Button
            onClick={sendLightCommand}
            disabled={mutation.isPending}
            variant="outline"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SunMedium className="h-4 w-4" />}
            Apply light setting
          </Button>
        </div>
      </div>

      {feedback ? (
        <div
          className={
            feedback.status === "success"
              ? "rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Moisture trend</h3>
          <p className="text-xs text-slate-500">Last 6 hours of readings for this planter.</p>
        </div>
        <SensorChart
          rackId={cell.rackId}
          row={cell.row}
          column={cell.column}
          sensorType="moisture_sensor"
        />
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
