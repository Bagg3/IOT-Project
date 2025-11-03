import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { pool } from "../db";

const router = Router();

router.get(
  "/dashboard/racks",
  async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        `SELECT r.id, r.rack_number, r.rows, r.columns, r.farm_id, f.name AS farm_name
         FROM racks r
         INNER JOIN farms f ON f.id = r.farm_id
         ORDER BY r.rack_number`
      );
      response.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/dashboard/farms/:farmId/racks",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ farmId: z.string().uuid() });
      const { farmId } = paramsSchema.parse(request.params);
      const result = await pool.query(
        `SELECT id, rack_number, rows, columns
         FROM racks
         WHERE farm_id = $1
         ORDER BY rack_number`,
        [farmId]
      );
      response.json(result.rows);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
