import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Plant, CellSnapshot } from "./types";

/**
 * Combine and merge class names for styling
*/
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse percentage value from various input formats
 */
export function parsePercentage(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }
  if (typeof input === "string") {
    const parsed = Number.parseFloat(input);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof input === "object" && input !== null && "value" in input) {
    const { value } = input as { value: unknown };
    return parsePercentage(value);
  }
  return null;
}

/**
 * Transform plant data to cell snapshots for UI display
 */
export function mapReadingsToCells(plants: Plant[]): CellSnapshot[] {
  return plants
    .map((plant) => ({
      rack_number: plant.rack_number,
      row: plant.row,
      column: plant.column,
      display_name: plant.display_name,
      planted_at: plant.planted_at,
      color: plant.color,
      moisturePercent: plant.moisture_level,
      lightPercent: plant.light_level
    }))
    .sort((a, b) => {
      if (a.row === b.row) {
        return a.column - b.column;
      }
      return a.row - b.row;
    });
}
