import { Button } from "../ui/button";
import { Droplet, Sun, Check, X } from "lucide-react";

interface ActuatorButtonsProps {
  waterStatus: "idle" | "loading" | "success" | "error";
  lightStatus: "idle" | "loading" | "success" | "error";
  onWater: () => void;
  onLight: () => void;
}

export function ActuatorButtons({ waterStatus, lightStatus, onWater, onLight }: ActuatorButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
      {/* Water Button */}
      <Button
        onClick={onWater}
        disabled={waterStatus === "loading"}
        className={`flex items-center justify-center gap-1.5 py-1.5 transition-colors ${
          waterStatus === "success"
            ? "bg-emerald-600 hover:bg-emerald-700"
            : waterStatus === "error"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
        }`}
        size="sm"
      >
        {waterStatus === "loading" ? (
          <>
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="text-xs">Watering…</span>
          </>
        ) : waterStatus === "success" ? (
          <>
            <Check className="h-3.5 w-3.5" />
            <span className="text-xs">Watered!</span>
          </>
        ) : waterStatus === "error" ? (
          <>
            <X className="h-3.5 w-3.5" />
            <span className="text-xs">Failed</span>
          </>
        ) : (
          <>
            <Droplet className="h-3.5 w-3.5" />
            <span className="text-xs">Water</span>
          </>
        )}
      </Button>

      {/* Light Button */}
      <Button
        onClick={onLight}
        disabled={lightStatus === "loading"}
        className={`flex items-center justify-center gap-1.5 py-1.5 transition-colors ${
          lightStatus === "success"
            ? "bg-emerald-600 hover:bg-emerald-700"
            : lightStatus === "error"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-amber-600 hover:bg-amber-700"
        }`}
        size="sm"
      >
        {lightStatus === "loading" ? (
          <>
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="text-xs">Adjusting…</span>
          </>
        ) : lightStatus === "success" ? (
          <>
            <Check className="h-3.5 w-3.5" />
            <span className="text-xs">Adjusted!</span>
          </>
        ) : lightStatus === "error" ? (
          <>
            <X className="h-3.5 w-3.5" />
            <span className="text-xs">Failed</span>
          </>
        ) : (
          <>
            <Sun className="h-3.5 w-3.5" />
            <span className="text-xs">Light</span>
          </>
        )}
      </Button>
    </div>
  );
}
