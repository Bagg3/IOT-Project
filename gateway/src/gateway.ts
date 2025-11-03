import mqtt from "mqtt";
import { env } from "./config/env";

const topicPattern = "greengrow/+/+/+/+/+/+";

const mqttClient = mqtt.connect(env.MQTT_URL);

mqttClient.on("connect", () => {
  console.log(`🔌 Gateway connected to MQTT broker at ${env.MQTT_URL}`);
  mqttClient.subscribe(topicPattern, (error: Error | null) => {
    if (error) {
      console.error("❌ Failed to subscribe to topic", error);
    } else {
      console.log(`📡 Subscribed to ${topicPattern}`);
    }
  });
});

mqttClient.on("error", (error: Error) => {
  console.error("❌ MQTT error", error);
});

mqttClient.on("message", async (topic, payload) => {
  try {
    const parts = topic.split("/");
    if (parts.length !== 7) {
      return;
    }

    const [, farmId, rackId, row, column, device, type] = parts;
    const value = JSON.parse(payload.toString());

    const sensorDevices = new Set(["light_sensor", "moisture_sensor", "color_camera"]);

    if (sensorDevices.has(device)) {
      await forwardSensorReading({
        rackId,
        row: Number.parseInt(row, 10),
        column: Number.parseInt(column, 10),
        sensorType: device,
        value
      });
      console.log(`➡️ Forwarded ${device} data from ${rackId}/${row}/${column}/${type}`);
    }
  } catch (error) {
    console.error("❌ Failed to handle MQTT message", error);
  }
});

async function forwardSensorReading({
  rackId,
  row,
  column,
  sensorType,
  value
}: {
  rackId: string;
  row: number;
  column: number;
  sensorType: string;
  value: unknown;
}): Promise<void> {
  const response = await fetch(`${env.API_URL}/sensor-readings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rack_id: rackId,
      row,
      column,
      sensor_type: sensorType,
      value
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to forward sensor reading (${response.status}): ${body}`);
  }
}

async function pollActuatorCommands(): Promise<void> {
  try {
    const response = await fetch(`${env.API_URL}/actuator-commands/pending`);
    if (!response.ok) {
      console.error("❌ Failed to fetch pending commands", response.statusText);
      return;
    }

    const commands: Array<{
      id: string;
      rack_id: string;
      row: number;
      column: number;
      actuator_type: string;
      action: string;
      parameters: unknown;
    }> = await response.json();

    for (const command of commands) {
      const parameters =
        typeof command.parameters === "string"
          ? JSON.parse(command.parameters)
          : command.parameters ?? {};
      const topic = `greengrow/farm_001/${command.rack_id}/${command.row}/${command.column}/${command.actuator_type}/${command.action}`;
      mqttClient.publish(topic, JSON.stringify(parameters));
      await markCommandStatus(command.id, "sent");
      console.log(`⬅️ Published command ${command.id} to ${topic}`);
    }
  } catch (error) {
    console.error("❌ Error while polling actuator commands", error);
  }
}

async function markCommandStatus(id: string, status: "pending" | "sent" | "completed" | "failed"): Promise<void> {
  const response = await fetch(`${env.API_URL}/actuator-commands/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`❌ Failed to update command status (${response.status}): ${body}`);
  }
}

setInterval(pollActuatorCommands, env.POLL_INTERVAL_MS);

void pollActuatorCommands();
