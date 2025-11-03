import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  getPlantLocationHistory,
  getRackPlantReadings,
  getRackSnapshots
} from "../services/rack-snapshot-service";

const router = Router();

const rackIdentifierSchema = z.object({ rackId: z.string().trim().min(1) });

router.get(
  "/racks",
  async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const racks = await getRackSnapshots();
      response.json(racks);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/racks/:rackId",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { rackId } = rackIdentifierSchema.parse(request.params);
      const [rack] = await getRackSnapshots(rackId);

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

router.get(
  "/racks/:rackId/plants",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { rackId } = rackIdentifierSchema.parse(request.params);
      const readings = await getRackPlantReadings(rackId);

      if (readings.length === 0) {
        const [rack] = await getRackSnapshots(rackId);
        if (!rack) {
          response.status(404).json({ message: "Rack not found" });
          return;
        }
      }

      response.json(readings);
    } catch (error) {
      next(error);
    }
  }
);

const historyParamsSchema = z.object({
  rackId: z.string().trim().min(1),
  row: z.coerce.number().int().positive(),
  column: z.coerce.number().int().positive()
});

const historyQuerySchema = z.object({
  hours: z.coerce.number().int().positive().max(720).default(24)
});

router.get(
  "/racks/:rackId/locations/:row/:column/history",
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const params = historyParamsSchema.parse(request.params);
      const { hours } = historyQuerySchema.parse(request.query);

      const history = await getPlantLocationHistory(params.rackId, params.row, params.column, hours);
      response.json(history);
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes("rack not found")) {
        response.status(404).json({ message: "Rack not found" });
        return;
      }

      next(error);
    }
  }
);

export const rackController = router;
