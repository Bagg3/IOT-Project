/**
 * Moisture Sensor Simulator
 * - Simulates soil moisture based on time of day (sine wave)
 * - Adds small random white noise for realism
 */

export function getSimulatedMoisture(): number {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;

    // One full sine wave per day (24 hours)
    const radians = (hours / 24) * 2 * Math.PI;

    // Simulate moisture: higher at night (sin = 1), lower in day (sin = -1)
    const baseMoisture = Math.sin(radians + Math.PI / 2);

    // Convert to 5 V: high at night (4,5 V), lower in day (2,5 V)
    const moistureVoltage = baseMoisture + 3.5

    // Add random white noise (±25%)
    const noise = ((Math.random() - 0.5) / 2) * moistureVoltage;

    // Clamp to 0–5 V range
    const moisture = Math.max(0, Math.min(5, moistureVoltage + noise));

    return moisture;
}

console.log(getSimulatedMoisture())
