export function getSimulatedLight(): number {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    const radians = (hours / 24) * Math.PI * 2;
    const baseLight = Math.sin(radians);
    const LightVoltage = (baseLight + 1) * 2.5
    const noise = (Math.random() - 0.5) * 0.1 * LightVoltage;
    const Light = Math.max(0, Math.min(5, LightVoltage + noise));
    return Light;
}

console.log(getSimulatedLight())
