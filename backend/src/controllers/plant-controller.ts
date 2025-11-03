import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { createPlant, deletePlant, updatePlant } from "../services/plant-service";

const router = Router();

const plantCreateSchema = z.object({
  species_id: z.string().trim().min(1),
  display_name: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  planted_on: z.coerce.date().optional(),
  notes: z.string().trim().optional()
});

const plantUpdateSchema = z
  .object({
    display_name: z.string().trim().min(1).optional(),
    status: z.string().trim().min(1).optional(),
    planted_on: z.coerce.date().optional(),
    harvested_on: z.coerce.date().optional(),
    notes: z.string().trim().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided for update"
  });

const rackLocationParamsSchema = z.object({
  rackId: z.string().trim().min(1),
  row: z.coerce.number().int().positive(),
  column: z.coerce.number().int().positive()
});

router.post(
  "/racks/:rackId/locations/:row/:column/plants",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const params = rackLocationParamsSchema.parse(request.params);
      const payload = plantCreateSchema.parse(request.body);

      const plant = await createPlant({
        rack_id: params.rackId,
        row: params.row,
        column: params.column,
        species_id: payload.species_id,
        display_name: payload.display_name ?? null,
        status: payload.status ?? null,
        planted_on: payload.planted_on ?? null,
        notes: payload.notes ?? null
      });

      response.status(201).json(plant);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/plants/:plantId",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ plantId: z.string().trim().min(1) });
      const { plantId } = paramsSchema.parse(request.params);
      const payload = plantUpdateSchema.parse(request.body);
      const plant = await updatePlant(plantId, payload);
      response.json(plant);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/plants/:plantId",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ plantId: z.string().trim().min(1) });
      const { plantId } = paramsSchema.parse(request.params);
      await deletePlant(plantId);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  }
);

export const plantController = router;
