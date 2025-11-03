import z from "zod";
import { execSync } from "child_process";
import { config } from "./config/env";

// Sleep helper
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const handleCommandParamsSchema = z.object({
    row: z.string().transform(str => Number(str)),
    column: z.string().transform(str => Number(str)),
    actuator: z.union([z.literal("water_pump"), z.literal("lamp")]),
    action: z.union([z.literal("spray_water"), z.literal("set_light_level")]),
    value: z.number()
})
type handleCommandParams = z.infer<typeof handleCommandParamsSchema>;

export function handleCommand({ row, column, actuator, action, value }: handleCommandParams) {
    switch (actuator) {
        case "water_pump":
            return handleWaterPump(value);
        case "lamp":
            return handleLamp(value);
        default:
            return actuator satisfies never;
    }
}

async function handleWaterPump(value: number) {
    execSync(`bun ${config.SENSOR_SCRIPT_PATH}water_actuator.ts 5`);
    await sleep(value * 1000); // Sleep x seconds
    execSync(`bun ${config.SENSOR_SCRIPT_PATH}water_actuator.ts 0`);
}

async function handleLamp(value: number) {
    execSync(`bun ${config.SENSOR_SCRIPT_PATH}water_actuator.ts ${value % 5}`);
} 