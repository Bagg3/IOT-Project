import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  createSpecies,
  deleteSpecies,
  getSpecies,
  listSpecies,
  updateSpecies
} from "../services/species-service";

const router = Router();

const speciesBodySchema = z.object({
  species_identifier: z.string().trim().min(1).optional(),
  species_name: z.string().trim().min(1),
  scientific_name: z.string().trim().min(1).optional(),
  optimal_moisture_min: z.number().finite().optional(),
  optimal_moisture_max: z.number().finite().optional(),
  optimal_temperature_min: z.number().finite().optional(),
  optimal_temperature_max: z.number().finite().optional(),
  optimal_light_intensity_min: z.number().finite().optional(),
  optimal_light_intensity_max: z.number().finite().optional(),
  optimal_color_index: z.number().finite().optional(),
  growth_duration_days: z.number().int().positive().optional()
});

const speciesPatchSchema = speciesBodySchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

router.get(
  "/species",
  async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const items = await listSpecies();
      response.json(items);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/species/:identifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      const species = await getSpecies(identifier);

      if (!species) {
        response.status(404).json({ message: "Species not found" });
        return;
      }

      response.json(species);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/species",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = speciesBodySchema.parse(request.body);
      const species = await createSpecies(payload);
      response.status(201).json(species);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/species/:identifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      const payload = speciesPatchSchema.parse(request.body);
      const species = await updateSpecies(identifier, payload);
      response.json(species);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/species/:identifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      await deleteSpecies(identifier);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  }
);

export const speciesController = router;
