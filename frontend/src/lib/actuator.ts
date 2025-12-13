
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

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

 // Activate water pump for a specific plant cell
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

  const url = `${API_BASE_URL}/actuators/water`;
  console.log("[Actuator API] POST", url, payload);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[Actuator API] Error activating water:", error);
    throw error;
  }
}

 // Adjust light for a specific plant cell
export async function adjustLight(
  rackNumber: number,
  row: number,
  column: number,
  intensity?: number
): Promise<ActuatorResponse> {
  const payload: ActuatorRequest & { parameters?: { intensity: number } } = {
    rackNumber,
    row,
    column,
    action: "light",
    timestamp: new Date().toISOString(),
    ...(intensity !== undefined && { parameters: { intensity } })
  };

  const url = `${API_BASE_URL}/actuators/light`;
  console.log("[Actuator API] POST", url, payload);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[Actuator API] Error adjusting light:", error);
    throw error;
  }
}
