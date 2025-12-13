export function getSimulatedMoisture(): number {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    const radians = (hours / 24) * 2 * Math.PI;
    const baseMoisture = Math.sin(radians + Math.PI / 2);
    const moistureVoltage = baseMoisture + 3.5
    const noise = ((Math.random() - 0.5) / 2) * moistureVoltage;
    const moisture = Math.max(0, Math.min(5, moistureVoltage + noise));
    return moisture;
}

console.log(getSimulatedMoisture())
