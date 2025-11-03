import express from "express";
import cors from "cors";
import type { Request, Response } from "express";
import { actuatorController } from "./controllers/actuator-controller";
import { errorHandler } from "./middleware/error-handler";
import { env } from "./config/env";
import { runMigrationsAndSeed } from "./lib/migrate";
import { startMqttClient } from "./integrations/mqtt-client";
import { plantController } from "./controllers/plant-controller";
import { rackController } from "./controllers/rack-controller";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN ?? true
  })
);
app.use(express.json());

app.get("/health", (_request: Request, response: Response) => {
  response.json({ status: "ok" });
});

app.use("/api", actuatorController);
app.use("/api", plantController);
app.use("/api", rackController);

app.use(errorHandler);

async function bootstrap(): Promise<void> {
  await runMigrationsAndSeed();
  startMqttClient();

  app.listen(env.PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${env.PORT}`);
  });
}

void bootstrap().catch((error) => {
  console.error("❌ Failed to start backend", error);
  nodeProcess?.exit?.(1);
});

type ProcessLike = {
    on: (event: "uncaughtException" | "unhandledRejection", listener: (value: unknown) => void) => void;
    exit?: (code?: number) => unknown;
};

const nodeProcess = (globalThis as typeof globalThis & { process?: ProcessLike }).process;

nodeProcess?.on("uncaughtException", (value) => {
  console.error("❌ Uncaught exception", value);
});

nodeProcess?.on("unhandledRejection", (value) => {
  console.error("❌ Unhandled rejection", value);
});
