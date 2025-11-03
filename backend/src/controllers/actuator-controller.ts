import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { triggerActuatorById } from "../services/actuator-service";

const router = Router();

const actuatorIdentifierSchema = z.object({ actuatorId: z.string().trim().min(1) });

const triggerSchema = z.object({
  action: z.string().trim().min(1),
  parameters: z.record(z.any()).optional(),
  triggered_by: z.string().trim().min(1).optional()
});

router.post(
  "/actuators/:actuatorId/commands",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { actuatorId } = actuatorIdentifierSchema.parse(request.params);
      const payload = triggerSchema.parse(request.body);

      const command = await triggerActuatorById(
        actuatorId,
        payload.action,
        payload.parameters ?? null,
        payload.triggered_by ?? null
      );

      response.status(201).json({
        id: command.id,
        actuator_id: command.actuator_id,
        plant_location_id: command.plant_location_id,
        actuator_type: command.actuator_type,
        action: command.action,
        parameters: command.parameters,
        status: command.status,
        created_at: command.created_at,
        updated_at: command.updated_at
      });
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("actuator not found")) {
        response.status(404).json({ message: "Actuator not found" });
        return;
      }

      next(error);
    }
  }
);

export const actuatorController = router;
