import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { listPlantLocationsByRack } from "../services/plant-location-service";

const router = Router();

router.get(
  "/plant-locations/:rackIdentifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ rackIdentifier: z.string().trim().min(1) });
      const { rackIdentifier } = paramsSchema.parse(request.params);
      const locations = await listPlantLocationsByRack(rackIdentifier);
      response.json(locations);
    } catch (error) {
      next(error);
    }
  }
);

export const plantLocationController = router;
