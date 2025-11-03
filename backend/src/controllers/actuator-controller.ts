import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  createActuatorCommand,
  getPendingActuatorCommands,
  type ActuatorCommandRecord,
  updateActuatorCommandStatus
} from "../services/actuator-service";

const router = Router();

const commandSchema = z.object({
  rack_id: z.string().uuid(),
  row: z.number().int().positive(),
  column: z.number().int().positive(),
  actuator_type: z.string().min(1),
  action: z.string().min(1),
  parameters: z.record(z.any()).optional()
});

const statusSchema = z.enum(["pending", "sent", "completed", "failed"]);

function sanitizeCommand(command: ActuatorCommandRecord): Omit<ActuatorCommandRecord, "farm_id"> {
  const { farm_id, ...rest } = command;
  return rest;
}

router.post(
  "/actuator-commands",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = commandSchema.parse(request.body);
      const command = await createActuatorCommand(payload);
      response.status(201).json({ id: command.id });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/actuator-commands/pending",
  async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const commands = await getPendingActuatorCommands();
      response.json(commands.map(sanitizeCommand));
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
      const { id } = paramsSchema.parse(request.params);
      const { status } = z.object({ status: statusSchema }).parse(request.body);

      const command = await updateActuatorCommandStatus(id, status);

      if (!command) {
        response.status(404).json({ message: "Command not found" });
        return;
      }

      response.json(sanitizeCommand(command));
    } catch (error) {
      next(error);
    }
  }
);

export const actuatorController = router;
