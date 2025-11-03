import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { pool } from "../db";

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
      await pool.query(
        `INSERT INTO sensor_readings (rack_id, "row", "column", sensor_type, value)
         VALUES ($1, $2, $3, $4, $5)`,
  [payload.rack_id, payload.row, payload.column, payload.sensor_type, JSON.stringify(payload.value)]
      );
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
      const result = await pool.query(
    `SELECT DISTINCT ON ("row", "column", sensor_type)
      id,
      rack_id,
      "row",
      "column",
      sensor_type,
      value::json AS value,
      timestamp
         FROM sensor_readings
         WHERE rack_id = $1
         ORDER BY "row", "column", sensor_type, timestamp DESC`,
        [rackId]
      );
      response.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/sensor-readings/history",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { rack_id, row, column, sensor_type, hours } = historyQuerySchema.parse(request.query);
      const result = await pool.query(
        `SELECT
           id,
           rack_id,
           "row",
           "column",
           sensor_type,
           value::json AS value,
           timestamp
         FROM sensor_readings
         WHERE rack_id = $1
           AND "row" = $2
           AND "column" = $3
           AND sensor_type = $4
           AND timestamp > NOW() - ($5 || ' hours')::INTERVAL
         ORDER BY timestamp DESC`,
        [rack_id, row, column, sensor_type, hours]
      );
      response.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
