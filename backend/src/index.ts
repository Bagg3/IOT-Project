import express from "express";
import cors from "cors";
import type { Request, Response } from "express";
import sensorRoutes from "./routes/sensors";
import actuatorRoutes from "./routes/actuators";
import dashboardRoutes from "./routes/dashboard";
import { errorHandler } from "./middleware/error-handler";
import { env } from "./config/env";
import { runMigrations } from "./lib/migrate";

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

app.use("/api", sensorRoutes);
app.use("/api", actuatorRoutes);
app.use("/api", dashboardRoutes);

app.use(errorHandler);

async function bootstrap(): Promise<void> {
  await runMigrations();

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
