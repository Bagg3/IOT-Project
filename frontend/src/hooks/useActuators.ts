import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { activateWater, adjustLight, type ActuatorResponse } from "../lib/actuator";

interface WaterMutationParams {
  rackNumber: number;
  row: number;
  column: number;
}

interface LightMutationParams {
  rackNumber: number;
  row: number;
  column: number;
  intensity?: number;
}

 // Hook for activating water pump with React Query mutation
export function useActivateWater(): UseMutationResult<
  ActuatorResponse,
  Error,
  WaterMutationParams
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rackNumber, row, column }: WaterMutationParams) => {
      return await activateWater(rackNumber, row, column);
    },
    onSuccess: (data, variables) => {
      console.log("[Actuator Hook] Water activated successfully:", data);
      // Invalidate sensor data to refetch latest readings
      void queryClient.invalidateQueries({ queryKey: ["sensor-data", variables.rackNumber] });
      void queryClient.invalidateQueries({ queryKey: ["raw-sensor-readings", variables.rackNumber] });
    },
    onError: (error) => {
      console.error("[Actuator Hook] Failed to activate water:", error);
    }
  });
}

 // Hook for adjusting light with React Query mutation
 export function useAdjustLight(): UseMutationResult<
  ActuatorResponse,
  Error,
  LightMutationParams
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rackNumber, row, column, intensity }: LightMutationParams) => {
      return await adjustLight(rackNumber, row, column, intensity);
    },
    onSuccess: (data, variables) => {
      console.log("[Actuator Hook] Light adjusted successfully:", data);
      // Invalidate sensor data to refetch latest readings
      void queryClient.invalidateQueries({ queryKey: ["sensor-data", variables.rackNumber] });
      void queryClient.invalidateQueries({ queryKey: ["raw-sensor-readings", variables.rackNumber] });
    },
    onError: (error) => {
      console.error("[Actuator Hook] Failed to adjust light:", error);
    }
  });
}
