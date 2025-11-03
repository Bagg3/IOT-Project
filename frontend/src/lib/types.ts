export interface RackSummary {
  id: string;
  rack_number: number;
  rows: number;
  columns: number;
}

export interface Plant {
  display_name: string;
  column: number;
  row: number;
  planted_at: string;
  light_level: number | null;
  moisture_level: number | null;
  color: string;
  rack_number: number;
}

export interface CellSnapshot {
  rackId: string;
  row: number;
  column: number;
  display_name: string | null;
  planted_at: string | null;
  color: string | null;
  moisturePercent: number | null;
  lightPercent: number | null;
}

export interface HistoricalDataPoint {
  timestamp: string;
  moisture: number;
  light: number;
}
