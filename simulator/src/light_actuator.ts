/**
 * Light Actuator Simulator
 * - Logs Commands: 0–5 V
 */

const LightArgs = process.argv.slice(2);

if (LightArgs.length === 0) {
    console.error("Usage: <node runtime cli> light_actuator.ts <voltage>");
    process.exit(1);
}

const LightVoltage = parseFloat(LightArgs[0]);

if (isNaN(LightVoltage)) {
    console.error("Error: LightVoltage must be a number.");
    process.exit(1);
}

// Clamp LightVoltage to 0–5 V
const LightVoltageClamped = Math.max(0, Math.min(5, LightVoltage));

console.log(`Light actuator: ${LightVoltageClamped.toFixed(2)} V`);
