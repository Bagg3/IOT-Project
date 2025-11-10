import { z } from "zod";

const numberOrString = z.union([
  z.number(),
  z.string()
]).transform(arg => Number(arg))

const schema = z.object({
  MQTT_URL: z.string().default("mqtt://localhost:1883"),
  POLL_INTERVAL_MS: numberOrString.default(2000),
  FARM_ID: numberOrString.default(1),
  RACK_ID: numberOrString.default(1),
  SENSOR_SCRIPT_PATH: z.string().default("../simulator/src/")
});

const envSource = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

const parsed = schema.safeParse(envSource);

if (!parsed.success) {
  console.error("Invalid gateway configuration", parsed.error.flatten());
  throw new Error("Invalid gateway configuration");
}

export const config = parsed.data;
