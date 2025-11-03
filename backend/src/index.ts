import express from "express";
import cors from "cors";
import type { Request, Response } from "express";
import { sensorController } from "./controllers/sensor-controller";
import { actuatorController } from "./controllers/actuator-controller";
import { dashboardController } from "./controllers/dashboard-controller";
import { errorHandler } from "./middleware/error-handler";
import { env } from "./config/env";
import { runMigrationsAndSeed } from "./lib/migrate";
import { startMqttClient } from "./integrations/mqtt-client";

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

app.use("/api", sensorController);
app.use("/api", actuatorController);
app.use("/api", dashboardController);

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
