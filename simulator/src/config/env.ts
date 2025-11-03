import { z } from "zod";

const schema = z.object({
  MQTT_URL: z.string().default("mqtt://localhost:1883"),
  FARM_ID: z.string().default("farm_001"),
  PUBLISH_INTERVAL_MS: z
    .string()
    .default("10000")
    .transform((value: string) => Number.parseInt(value, 10))
});

const envSource = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

const parsed = schema.safeParse(envSource);

if (!parsed.success) {
  console.error("❌ Invalid simulator configuration", parsed.error.flatten());
  throw new Error("Invalid simulator configuration");
}

export const env = parsed.data;
