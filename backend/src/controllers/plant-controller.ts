import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  createPlant,
  deletePlant,
  getPlant,
  listPlants,
  updatePlant
} from "../services/plant-service";

const router = Router();

const listQuerySchema = z.object({
  farm_id: z.string().trim().min(1).optional(),
  rack_id: z.string().trim().min(1).optional(),
  species_id: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional()
});

const plantCreateSchema = z.object({
  rack_id: z.string().trim().min(1),
  row: z.number().int().positive(),
  column: z.number().int().positive(),
  species_id: z.string().trim().min(1),
  display_name: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  planted_on: z.coerce.date().optional(),
  notes: z.string().trim().optional()
});

const plantPatchSchema = z
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

router.get(
  "/plants",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const query = listQuerySchema.parse(request.query);
      const plants = await listPlants(query);
      response.json(plants);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/plants/:identifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      const plant = await getPlant(identifier);

      if (!plant) {
        response.status(404).json({ message: "Plant not found" });
        return;
      }

      response.json(plant);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/plants",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = plantCreateSchema.parse(request.body);
      const plant = await createPlant(payload);
      response.status(201).json(plant);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/plants/:identifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      const payload = plantPatchSchema.parse(request.body);
      const plant = await updatePlant(identifier, payload);
      response.json(plant);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/plants/:identifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      await deletePlant(identifier);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  }
);

export const plantController = router;
