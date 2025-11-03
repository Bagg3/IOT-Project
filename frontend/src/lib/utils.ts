import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parsePercentage(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input;
  }
  if (typeof input === "string") {
    const parsed = Number.parseFloat(input);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof input === "object" && input !== null && "value" in input) {
    const { value } = input as { value: unknown };
    return parsePercentage(value);
  }
  return null;
}
