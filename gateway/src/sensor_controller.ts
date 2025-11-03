import { execSync } from "child_process";
import { config } from "./config/env";

export function ReadMoisture() {
    const rawReading = execSync(`bun ${config.SENSOR_SCRIPT_PATH}moisture_sensor.ts`)
    const parsedReading = Number(rawReading);
    if (isNaN(parsedReading)) {
        console.error("Invalid Moisture Reading", rawReading);
        throw new Error("Invalid Moisture Reading");
    }
    return parsedReading;
}

export function ReadLight() {
    const rawReading = execSync(`bun ${config.SENSOR_SCRIPT_PATH}light_sensor.ts`)
    const parsedReading = Number(rawReading);
    if (isNaN(parsedReading)) {
        console.error("Invalid Light Reading", rawReading);
        throw new Error("Invalid Light Reading");
    }
    return parsedReading;
}

export function ReadColor() {
    const rawReading = execSync(`bun ${config.SENSOR_SCRIPT_PATH}color_sensor.ts`)
    const rawReadingArray = String(rawReading).split("\n")
    const parsedReadings = {
        r: Number(rawReadingArray[0]),
        g: Number(rawReadingArray[1]),
        b: Number(rawReadingArray[2])
    }
    if (Object.values(parsedReadings).some(value => isNaN(value))) {
        console.error("Invalid Color Reading", rawReading);
        throw new Error("Invalid Color Reading");
    }
    return parsedReadings;
}