import type { Plant, RackSummary, HistoricalDataPoint } from "./types";

/**
 * Mock racks for development
 */
export const MOCK_RACKS: RackSummary[] = [
  { id: "rack-1", rack_number: 1, rows: 4, columns: 6 },
  { id: "rack-2", rack_number: 2, rows: 4, columns: 6 },
  { id: "rack-3", rack_number: 3, rows: 3, columns: 5 }
];

/**
 * Base mock plants data
 */
const MOCK_PLANTS_BASE: Plant[] = [
  // Rack 1 - Row 1 (Herbs)
  { display_name: "Basil", column: 1, row: 1, planted_at: "2025-10-15", light_level: 75, moisture_level: 60, color: "#22c55e", rack_number: 1 },
  { display_name: "Parsley", column: 2, row: 1, planted_at: "2025-10-18", light_level: 80, moisture_level: 55, color: "#16a34a", rack_number: 1 },
  { display_name: "Thyme", column: 3, row: 1, planted_at: "2025-10-20", light_level: 70, moisture_level: 40, color: "#15803d", rack_number: 1 },
  { display_name: "Oregano", column: 4, row: 1, planted_at: "2025-10-12", light_level: 72, moisture_level: 35, color: "#166534", rack_number: 1 },
  { display_name: "Rosemary", column: 5, row: 1, planted_at: "2025-10-10", light_level: 65, moisture_level: 30, color: "#14532d", rack_number: 1 },
  { display_name: "Sage", column: 6, row: 1, planted_at: "2025-10-14", light_level: 68, moisture_level: 45, color: "#1a3a2a", rack_number: 1 },
  // Rack 1 - Row 2 (Leafy Greens)
  { display_name: "Lettuce", column: 1, row: 2, planted_at: "2025-10-22", light_level: 85, moisture_level: 70, color: "#84cc16", rack_number: 1 },
  { display_name: "Spinach", column: 2, row: 2, planted_at: "2025-10-20", light_level: 80, moisture_level: 65, color: "#65a30d", rack_number: 1 },
  { display_name: "Kale", column: 3, row: 2, planted_at: "2025-10-18", light_level: 82, moisture_level: 68, color: "#4d7c0f", rack_number: 1 },
  { display_name: "Arugula", column: 4, row: 2, planted_at: "2025-10-25", light_level: 88, moisture_level: 72, color: "#52b788", rack_number: 1 },
  { display_name: "Chard", column: 5, row: 2, planted_at: "2025-10-19", light_level: 79, moisture_level: 62, color: "#2d6a4f", rack_number: 1 },
  { display_name: "Microgreens", column: 6, row: 2, planted_at: "2025-10-28", light_level: 90, moisture_level: 75, color: "#1b4332", rack_number: 1 },
  // Rack 1 - Row 3 (Mixed Herbs)
  { display_name: "Cilantro", column: 1, row: 3, planted_at: "2025-10-17", light_level: 74, moisture_level: 58, color: "#2d8b4b", rack_number: 1 },
  { display_name: "Dill", column: 2, row: 3, planted_at: "2025-10-21", light_level: 76, moisture_level: 52, color: "#40916c", rack_number: 1 },
  { display_name: "Mint", column: 3, row: 3, planted_at: "2025-10-16", light_level: 72, moisture_level: 62, color: "#52b788", rack_number: 1 },
  { display_name: "Chives", column: 4, row: 3, planted_at: "2025-10-23", light_level: 77, moisture_level: 54, color: "#74c69d", rack_number: 1 },
  { display_name: "Tarragon", column: 5, row: 3, planted_at: "2025-10-13", light_level: 71, moisture_level: 48, color: "#95d5b2", rack_number: 1 },
  { display_name: "Marjoram", column: 6, row: 3, planted_at: "2025-10-19", light_level: 69, moisture_level: 50, color: "#b7e4c7", rack_number: 1 },
  // Rack 1 - Row 4 (More Herbs)
  { display_name: "Coriander", column: 1, row: 4, planted_at: "2025-10-24", light_level: 73, moisture_level: 56, color: "#d8f3dc", rack_number: 1 },
  { display_name: "Chervil", column: 2, row: 4, planted_at: "2025-10-26", light_level: 78, moisture_level: 60, color: "#52b788", rack_number: 1 },
  { display_name: "Sorrel", column: 3, row: 4, planted_at: "2025-10-11", light_level: 67, moisture_level: 38, color: "#40916c", rack_number: 1 },
  { display_name: "Borage", column: 4, row: 4, planted_at: "2025-10-27", light_level: 81, moisture_level: 64, color: "#2d8b4b", rack_number: 1 },
  { display_name: "Lovage", column: 5, row: 4, planted_at: "2025-10-09", light_level: 66, moisture_level: 42, color: "#1b4332", rack_number: 1 },
  { display_name: "Fennel", column: 6, row: 4, planted_at: "2025-10-15", light_level: 70, moisture_level: 50, color: "#2d6a4f", rack_number: 1 },
  // Rack 2 - Row 1 (Vegetables)
  { display_name: "Tomato", column: 1, row: 1, planted_at: "2025-09-15", light_level: 92, moisture_level: 65, color: "#dc2626", rack_number: 2 },
  { display_name: "Pepper", column: 2, row: 1, planted_at: "2025-09-18", light_level: 90, moisture_level: 60, color: "#f97316", rack_number: 2 },
  { display_name: "Eggplant", column: 3, row: 1, planted_at: "2025-09-20", light_level: 88, moisture_level: 62, color: "#7c3aed", rack_number: 2 },
  { display_name: "Cucumber", column: 4, row: 1, planted_at: "2025-09-12", light_level: 85, moisture_level: 72, color: "#0891b2", rack_number: 2 },
  { display_name: "Zucchini", column: 5, row: 1, planted_at: "2025-09-10", light_level: 87, moisture_level: 68, color: "#16a34a", rack_number: 2 },
  { display_name: "Squash", column: 6, row: 1, planted_at: "2025-09-14", light_level: 86, moisture_level: 70, color: "#eab308", rack_number: 2 }
];

/**
 * Generate mutated mock plant data based on current time
 * Simulates small fluctuations in sensor readings over time
 */
export function generateMockPlants(): Plant[] {
  const now = Date.now();
  const secondsElapsed = Math.floor(now / 1000);

  // Use seconds to create deterministic but changing values
  // This ensures the same second gives the same data, but data changes every second
  const seed = secondsElapsed % 60; // Cycle every 60 seconds

  return MOCK_PLANTS_BASE.map((plant) => {
    // Create deterministic variations based on plant position and time
    const plantSeed = plant.row * 10 + plant.column + (plant.rack_number * 100);
    const hashValue = (plantSeed * 73856093 ^ seed * 19349663) >>> 0;

    // Simulate small fluctuations in moisture and light levels
    // ±5% variation from base value
    const moistureVariation = ((hashValue % 11) - 5) * 0.5; // -2.5 to 2.5
    const lightVariation = (((hashValue >> 8) % 11) - 5) * 0.5; // -2.5 to 2.5

    return {
      ...plant,
      moisture_level: Math.max(20, Math.min(90, plant.moisture_level! + moistureVariation)),
      light_level: Math.max(30, Math.min(95, plant.light_level! + lightVariation))
    };
  });
}

/**
 * Generate mock historical data for a plant based on current time
 * Returns 24 data points representing the last 24 hours (1 point per hour)
 */
export function generateHistoricalData(row: number, column: number, rackNumber: number): HistoricalDataPoint[] {
  const now = Date.now();
  const baseTimestamp = Math.floor(now / 3600000) * 3600000; // Round to nearest hour
  const plantSeed = row * 10 + column + (rackNumber * 100);

  const dataPoints: HistoricalDataPoint[] = [];

  // Generate 24 historical points (one per hour)
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(baseTimestamp - i * 3600000);
    const timeKey = timestamp.getTime() / 3600000; // Hour-based key

    // Create deterministic variations based on plant position and time
    const hashValue = (plantSeed * 73856093 ^ Math.floor(timeKey) * 19349663) >>> 0;

    // Create cyclic patterns that repeat roughly daily
    const hourOfDay = timestamp.getHours();
    const cycleFactor = Math.sin((hourOfDay / 24) * Math.PI * 2) * 15; // ±15% daily cycle

    // Base values from MOCK_PLANTS_BASE
    const basePlant = MOCK_PLANTS_BASE.find((p) => p.row === row && p.column === column && p.rack_number === rackNumber);
    const baseMoisture = basePlant?.moisture_level ?? 50;
    const baseLight = basePlant?.light_level ?? 70;

    const moistureVariation = ((hashValue % 21) - 10) * 0.8 + cycleFactor * 0.5;
    const lightVariation = (((hashValue >> 8) % 21) - 10) * 0.8 + cycleFactor;

    dataPoints.push({
      timestamp: timestamp.toISOString(),
      moisture: Math.max(20, Math.min(90, baseMoisture + moistureVariation)),
      light: Math.max(30, Math.min(95, baseLight + lightVariation))
    });
  }

  return dataPoints;
}
