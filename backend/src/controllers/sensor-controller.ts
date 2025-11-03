import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  createSensorReading,
  getLatestSensorReadings,
  getSensorReadingHistory
} from "../services/sensor-service";

const router = Router();

const readingSchema = z.object({
  rack_id: z.string().uuid(),
  row: z.number().int().positive(),
  column: z.number().int().positive(),
  sensor_type: z.string().min(1),
  value: z.record(z.any())
});

const historyQuerySchema = z.object({
  rack_id: z.string().uuid(),
  row: z.coerce.number().int().positive(),
  column: z.coerce.number().int().positive(),
  sensor_type: z.string().min(1),
  hours: z.coerce.number().int().positive().max(168).default(24)
});

router.post(
  "/sensor-readings",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = readingSchema.parse(request.body);
      await createSensorReading(payload);
      response.status(201).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/sensor-readings/latest/:rackId",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ rackId: z.string().uuid() });
      const { rackId } = paramsSchema.parse(request.params);
      const readings = await getLatestSensorReadings(rackId);
      response.json(readings);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/sensor-readings/history",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const query = historyQuerySchema.parse(request.query);
      const readings = await getSensorReadingHistory(query);
      response.json(readings);
    } catch (error) {
      next(error);
    }
  }
);

export const sensorController = router;
