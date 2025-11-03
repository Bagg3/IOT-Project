import mqtt, { type MqttClient } from "mqtt";
import { env } from "../config/env";
import {
  createSensorReading,
  type CreateSensorReadingInput
} from "../services/sensor-service";
import {
  getPendingActuatorCommands,
  registerActuatorCommandPublisher,
  updateActuatorCommandStatus,
  type ActuatorCommandRecord
} from "../services/actuator-service";

const SENSOR_TOPIC = "greengrow/+/+/+/+/+/+";
const SENSOR_DEVICES = new Set(["light_sensor", "moisture_sensor", "color_camera"]);

let client: MqttClient | null = null;

export function startMqttClient(): void {
  if (client) {
    return;
  }

  client = mqtt.connect(env.MQTT_URL);

  client.on("connect", () => {
  console.log(`Connected to MQTT broker at ${env.MQTT_URL}`);
    client?.subscribe(SENSOR_TOPIC, (error) => {
      if (error) {
        console.error("Failed to subscribe to sensor topics", error);
        return;
      }

      console.log(`Subscribed to sensor topics (${SENSOR_TOPIC})`);
      void resendPendingCommands();
    });
  });

  client.on("error", (error) => {
    console.error("MQTT client error", error);
  });

  client.on("message", (topic, payload) => {
    void handleSensorMessage(topic, payload);
  });

  registerActuatorCommandPublisher(async (command) => {
    await publishActuatorCommand(command);
  });
}

async function handleSensorMessage(topic: string, payload: Buffer): Promise<void> {
  const segments = topic.split("/");
  if (segments.length < 7 || segments[0] !== "greengrow") {
    return;
  }

  const [, , rackId, rowSegment, columnSegment, device] = segments;

  if (!SENSOR_DEVICES.has(device)) {
    return;
  }

  const row = Number.parseInt(rowSegment, 10);
  const column = Number.parseInt(columnSegment, 10);

  if (!Number.isFinite(row) || !Number.isFinite(column)) {
  console.warn(`Invalid position received from topic ${topic}`);
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.toString("utf8"));
  } catch (error) {
  console.warn(`Unable to parse MQTT payload for topic ${topic}`, error);
    return;
  }

  const value = typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : { value: parsed };

  const reading: CreateSensorReadingInput = {
    rack_id: rackId,
    row,
    column,
    sensor_type: device,
    value
  };

  try {
    await createSensorReading(reading);
  } catch (error) {
  console.error(`Failed to persist sensor reading from topic ${topic}`, error);
  }
}

async function publishActuatorCommand(command: ActuatorCommandRecord): Promise<void> {
  if (!client || !client.connected) {
  console.warn("MQTT client not connected; command will be retried later");
    return;
  }

  const topic = buildActuatorTopic(command);
  if (!topic) {
  console.warn(`Missing farm identifier for command ${command.id}`);
    return;
  }

  try {
    await publishAsync(topic, JSON.stringify(command.parameters ?? {}));
    await updateActuatorCommandStatus(command.id, "sent");
  } catch (error) {
  console.error(`Failed to publish actuator command ${command.id}`, error);
  }
}

async function resendPendingCommands(): Promise<void> {
  try {
    const pending = await getPendingActuatorCommands();
    for (const command of pending) {
      await publishActuatorCommand(command);
    }
  } catch (error) {
  console.error("Failed to resend pending actuator commands", error);
  }
}

function buildActuatorTopic(command: ActuatorCommandRecord): string | null {
  if (!command.farm_id) {
    return null;
  }

  return `greengrow/${command.farm_id}/${command.rack_id}/${command.row}/${command.column}/${command.actuator_type}/${command.action}`;
}

function publishAsync(topic: string, message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client?.publish(topic, message, { qos: 1 }, (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
