import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  createFarm,
  deleteFarm,
  getFarm,
  listFarms,
  updateFarm
} from "../services/farm-service";
import { listRacksByFarm } from "../services/rack-service";

const router = Router();

const farmSchema = z.object({
  farm_identifier: z.string().trim().min(1).optional(),
  farm_name: z.string().trim().min(1),
  address: z.string().trim().min(1).optional()
});

const farmPatchSchema = farmSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

router.get(
  "/farms",
  async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const farms = await listFarms();
      response.json(farms);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/farms/:identifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      const farm = await getFarm(identifier);

      if (!farm) {
        response.status(404).json({ message: "Farm not found" });
        return;
      }

      response.json(farm);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/farms",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const payload = farmSchema.parse(request.body);
      const farm = await createFarm(payload);
      response.status(201).json(farm);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/farms/:identifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      const payload = farmPatchSchema.parse(request.body);
      const farm = await updateFarm(identifier, payload);
      response.json(farm);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/farms/:identifier",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      await deleteFarm(identifier);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/farms/:identifier/racks",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const paramsSchema = z.object({ identifier: z.string().trim().min(1) });
      const { identifier } = paramsSchema.parse(request.params);
      const racks = await listRacksByFarm(identifier);
      response.json(racks);
    } catch (error) {
      next(error);
    }
  }
);

export const farmController = router;
