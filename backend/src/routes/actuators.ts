import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { pool } from "../db";

const router = Router();

const commandSchema = z.object({
  rack_id: z.string().uuid(),
  row: z.number().int().positive(),
  column: z.number().int().positive(),
  actuator_type: z.string().min(1),
  action: z.string().min(1),
  parameters: z.record(z.any()).optional()
});

router.post(
  "/actuator-commands",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = commandSchema.parse(request.body);
      const result = await pool.query(
        `INSERT INTO actuator_commands (rack_id, "row", "column", actuator_type, action, parameters)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          payload.rack_id,
          payload.row,
          payload.column,
          payload.actuator_type,
          payload.action,
          payload.parameters ? JSON.stringify(payload.parameters) : null
        ]
      );
      response.status(201).json({ id: result.rows[0]?.id });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/actuator-commands/pending",
  async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        `SELECT
           id,
           rack_id,
           "row",
           "column",
           actuator_type,
           action,
           parameters::json AS parameters,
           status,
           created_at,
           updated_at
         FROM actuator_commands
         WHERE status = 'pending'
         ORDER BY created_at`
      );
  const commands = result.rows.map((row: Record<string, unknown>) => ({
        ...row,
        parameters:
          typeof row.parameters === "string"
            ? JSON.parse(row.parameters)
            : row.parameters
      }));
      response.json(commands);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/actuator-commands/:id",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ id: z.string().uuid() });
      const bodySchema = z.object({
        status: z.enum(["pending", "sent", "completed", "failed"])
      });

      const { id } = paramsSchema.parse(request.params);
      const { status } = bodySchema.parse(request.body);

      const result = await pool.query(
        `UPDATE actuator_commands
         SET status = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING
           id,
           rack_id,
           "row",
           "column",
           actuator_type,
           action,
           parameters::json AS parameters,
           status,
           created_at,
           updated_at`,
        [status, id]
      );

      if (result.rowCount === 0) {
        response.status(404).json({ message: "Command not found" });
        return;
      }

      const row = result.rows[0];
      response.json(row);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
