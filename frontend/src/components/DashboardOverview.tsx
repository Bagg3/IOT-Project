import { useMemo } from "react";
import { useSensorData } from "../hooks";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { TrendingUp, AlertCircle, Zap } from "lucide-react";

interface DashboardOverviewProps {
  rackId: string | null;
}

/**
 * High-level overview dashboard showing key metrics for entire rack
 * Displays total cells, active sensors, and overall health status
 */
export function DashboardOverview({ rackId }: DashboardOverviewProps) {
  const { data: cells, isLoading, isError } = useSensorData(rackId);

  const metrics = useMemo(() => {
    if (!cells) {
      return {
        totalCells: 0,
        cellsWithData: 0,
        healthyCells: 0,
        atRiskCells: 0,
        dryCells: 0
      };
    }

    const totalCells = cells.length;
    const cellsWithData = cells.filter((cell) => cell.moisturePercent !== null).length;
    const healthyCells = cells.filter(
      (cell) =>
        cell.moisturePercent !== null &&
        cell.moisturePercent >= 50 &&
        cell.moisturePercent <= 80
    ).length;
    const atRiskCells = cells.filter(
      (cell) =>
        cell.moisturePercent !== null &&
        (cell.moisturePercent < 30 || cell.moisturePercent > 80)
    ).length;
    const dryCells = cells.filter(
      (cell) => cell.moisturePercent !== null && cell.moisturePercent < 30
    ).length;

    return {
      totalCells,
      cellsWithData,
      healthyCells,
      atRiskCells,
      dryCells
    };
  }, [cells]);

  const healthPercentage = metrics.totalCells > 0
    ? Math.round((metrics.healthyCells / metrics.totalCells) * 100)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Cells</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : (
            <div className="text-3xl font-bold">{metrics.totalCells}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Active</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : (
            <>
              <div className="text-3xl font-bold">{metrics.cellsWithData}</div>
              <p className="mt-1 text-xs text-slate-500">
                {metrics.totalCells > 0
                  ? `${Math.round((metrics.cellsWithData / metrics.totalCells) * 100)}%`
                  : "—"}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1 text-sm font-medium text-emerald-900">
            <TrendingUp className="h-4 w-4" />
            Healthy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-emerald-700">
                {metrics.healthyCells}
              </div>
              <p className="mt-1 text-xs text-emerald-600">{healthPercentage}% optimal</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1 text-sm font-medium text-orange-900">
            <AlertCircle className="h-4 w-4" />
            At Risk
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-orange-700">
                {metrics.atRiskCells}
              </div>
              <p className="mt-1 text-xs text-orange-600">
                {metrics.dryCells} very dry
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1 text-sm font-medium">
            <Zap className="h-4 w-4" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Badge variant="outline" className="text-xs">
              Loading…
            </Badge>
          ) : isError ? (
            <Badge variant="critical" className="text-xs">
              Error
            </Badge>
          ) : metrics.atRiskCells > 0 ? (
            <Badge variant="warning" className="text-xs">
              Attention needed
            </Badge>
          ) : metrics.cellsWithData < metrics.totalCells ? (
            <Badge variant="warning" className="text-xs">
              Partial data
            </Badge>
          ) : (
            <Badge variant="default" className="text-xs">
              All healthy
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
