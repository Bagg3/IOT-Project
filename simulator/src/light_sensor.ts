/**
 * Light Sensor Simulator
 * - Simulates Light based on time of day (sine wave)
 * - Adds small random white noise for realism
 */

export function getSimulatedLight(): number {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;

    // One full sine wave per day (24 hours)
    const radians = (hours / 24) * Math.PI * 2;

    // Simulate Light: higher in day (sin = 1), lower at night (sin = -1)
    const baseLight = Math.sin(radians);

    // Convert to 5 V: high at night (5 V), lower in day (0 V)
    const LightVoltage = (baseLight + 1) * 2.5

    // Add random white noise (±5%)
    const noise = (Math.random() - 0.5) * 0.1 * LightVoltage;

    // Clamp to 0–5 V range
    const Light = Math.max(0, Math.min(5, LightVoltage + noise));

    return Light;
}

console.log(getSimulatedLight())
