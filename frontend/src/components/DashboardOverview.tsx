import { useMemo } from "react";
import { useSensorData } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface DashboardOverviewProps {
  rackNumber: number | null;
}

/**
 * High-level overview dashboard showing key metrics for entire rack
 * Displays health status of the rack at a glance
 */
export function DashboardOverview({ rackNumber }: DashboardOverviewProps) {
  const { data: cells, isLoading } = useSensorData(rackNumber);

  const metrics = useMemo(() => {
    if (!cells) {
      return {
        healthyCells: 0,
        atRiskCells: 0,
        noDataCells: 0
      };
    }

    const healthyCells = cells.filter(
      (cell) =>
        cell.moisturePercent !== null &&
        cell.moisturePercent >= 40 &&
        cell.moisturePercent <= 80
    ).length;
    const atRiskCells = cells.filter(
      (cell) =>
        cell.moisturePercent !== null &&
        (cell.moisturePercent < 40 || cell.moisturePercent > 80)
    ).length;
    const noDataCells = cells.filter((cell) => cell.moisturePercent === null).length;

    return {
      healthyCells,
      atRiskCells,
      noDataCells
    };
  }, [cells]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-emerald-900">
            Healthy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : (
            <div className="text-3xl font-bold text-emerald-700">{metrics.healthyCells}</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-orange-900">
            At Risk
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : (
            <div className="text-3xl font-bold text-orange-700">{metrics.atRiskCells}</div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-900">
            No Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : (
            <div className="text-3xl font-bold text-slate-700">{metrics.noDataCells}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
