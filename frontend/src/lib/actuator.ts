/**
 * Actuator API - Controls plant actuators (water pump, light adjustment)
 * Currently mocks POST calls to the backend with console logging
 */

export interface ActuatorRequest {
  rackNumber: number;
  row: number;
  column: number;
  action: "water" | "light";
  timestamp: string;
}

export interface ActuatorResponse {
  success: boolean;
  message: string;
  data?: ActuatorRequest | (ActuatorRequest & { intensity?: number });
}

/**
 * Activate water pump for a specific plant cell
 */
export async function activateWater(
  rackNumber: number,
  row: number,
  column: number
): Promise<ActuatorResponse> {
  const payload: ActuatorRequest = {
    rackNumber,
    row,
    column,
    action: "water",
    timestamp: new Date().toISOString()
  };

  console.log("[Actuator API] POST /actuators/water", payload);

  // Mock API call - in production, this would be:
  // const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/actuators/water`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload)
  // });
  // return response.json();

  return {
    success: true,
    message: `Water pump activated for Rack ${rackNumber}, Row ${row}, Col ${column}`,
    data: payload
  };
}

/**
 * Adjust light for a specific plant cell
 */
export async function adjustLight(
  rackNumber: number,
  row: number,
  column: number,
  intensity?: number
): Promise<ActuatorResponse> {
  const payload: ActuatorRequest = {
    rackNumber,
    row,
    column,
    action: "light",
    timestamp: new Date().toISOString()
  };

  console.log("[Actuator API] POST /actuators/light", {
    ...payload,
    ...(intensity !== undefined && { intensity })
  });

  // Mock API call - in production, this would be:
  // const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/actuators/light`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ ...payload, intensity })
  // });
  // return response.json();

  return {
    success: true,
    message: `Light adjusted for Rack ${rackNumber}, Row ${row}, Col ${column}${intensity !== undefined ? ` to ${intensity}%` : ""}`,
    data: { ...payload, ...(intensity !== undefined && { intensity }) }
  };
}
