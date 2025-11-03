import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  createRack,
  deleteRack,
  getRack,
  listRacks,
  updateRack
} from "../services/rack-service";

const router = Router();

const rackSchema = z.object({
  farm_id: z.string().trim().min(1),
  rack_number: z.number().int().positive().optional(),
  rack_name: z.string().trim().min(1).optional(),
  rows: z.number().int().positive().optional(),
  columns: z.number().int().positive().optional(),
  max_rows: z.number().int().positive().optional(),
  max_columns: z.number().int().positive().optional()
});

const rackPatchSchema = rackSchema.partial().extend({ farm_id: z.never().optional() }).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update"
  }
);

router.get(
  "/racks",
  async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const racks = await listRacks();
      response.json(racks);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/racks/:identifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      const rack = await getRack(identifier);

      if (!rack) {
        response.status(404).json({ message: "Rack not found" });
        return;
      }

      response.json(rack);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/racks",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = rackSchema.parse(request.body);
      const rack = await createRack(payload);
      response.status(201).json(rack);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/racks/:identifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      const payload = rackPatchSchema.parse(request.body);
      const rack = await updateRack(identifier, payload);
      response.json(rack);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/racks/:identifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      await deleteRack(identifier);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  }
);

export const rackController = router;
