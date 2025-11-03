import { z } from "zod";

const envSchema = z.object({
  PORT: z
    .string()
    .default("3000")
    .transform((value: string) => Number.parseInt(value, 10)),
  DATABASE_HOST: z.string().default("localhost"),
  DATABASE_PORT: z
    .string()
    .default("5432")
    .transform((value: string) => Number.parseInt(value, 10)),
  DATABASE_NAME: z.string().default("greengrow"),
  DATABASE_USER: z.string().default("greengrow"),
  DATABASE_PASSWORD: z.string().default("password"),
  MQTT_URL: z.string().default("mqtt://localhost:1883"),
  CORS_ORIGIN: z.string().optional()
});

const envSource = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

const parsed = envSchema.safeParse(envSource);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration", parsed.error.flatten());
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;
