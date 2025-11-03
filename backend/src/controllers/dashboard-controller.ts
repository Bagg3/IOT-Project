import { Router, type NextFunction, type Request, type Response } from "express";
import { getRacks } from "../services/dashboard-service";

const router = Router();

router.get(
  "/dashboard/racks",
  async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const racks = await getRacks();
      response.json(racks);
    } catch (error) {
      next(error);
    }
  }
);

export const dashboardController = router;
