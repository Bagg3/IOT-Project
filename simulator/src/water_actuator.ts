/**
 * Water Actuator Simulator
 * - Logs Commands: 0–5 V
 */

const WaterArgs = process.argv.slice(2);

if (WaterArgs.length === 0) {
    console.error("Usage: <node runtime cli> water_actuator.ts <WaterVoltage>");
    process.exit(1);
}

const WaterVoltage = parseFloat(WaterArgs[0]);

if (isNaN(WaterVoltage)) {
    console.error("Error: WaterVoltage must be a number.");
    process.exit(1);
}

// Clamp WaterVoltage to 0–5 V
const WaterVoltageClamped = Math.max(0, Math.min(5, WaterVoltage));

console.log(`Water actuator: ${WaterVoltageClamped.toFixed(2)} V`);
