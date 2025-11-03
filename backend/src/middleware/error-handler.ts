import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
): void {
  if (error instanceof ZodError) {
    const zodError: ZodError = error;
    response.status(400).json({
      message: "Validation failed",
      issues: zodError.issues
    });
    return;
  }

  console.error("❌ Unhandled error", error);
  response.status(500).json({ message: "Internal server error" });
}
