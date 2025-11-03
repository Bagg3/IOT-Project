import mqtt from "mqtt";
import { env } from "./config/env";

type TopicBuilderArgs = {
  farmId: string;
  rackId: string;
  row: number;
  column: number;
};

type SensorPayload = {
  value: number;
  unit: string;
};

type Position = {
  rackId: string;
  row: number;
  column: number;
  moisture: number;
  lightLevel: number;
};

const racks = [
  { rackId: "00000000-0000-0000-0000-000000000101", rows: 5, columns: 5 },
  { rackId: "00000000-0000-0000-0000-000000000102", rows: 5, columns: 5 },
  { rackId: "00000000-0000-0000-0000-000000000103", rows: 5, columns: 5 }
];

const positions: Position[] = [];

for (const rack of racks) {
  for (let row = 1; row <= rack.rows; row += 1) {
    for (let column = 1; column <= rack.columns; column += 1) {
      positions.push({
        rackId: rack.rackId,
        row,
        column,
        moisture: 50 + Math.random() * 30,
        lightLevel: 60 + Math.random() * 20
      });
    }
  }
}

const client = mqtt.connect(env.MQTT_URL);

client.on("connect", () => {
  console.log(`🧪 Simulator connected to MQTT at ${env.MQTT_URL} (${positions.length} positions)`);
  client.subscribe("greengrow/+/+/+/+/water_pump/spray_water");
  client.subscribe("greengrow/+/+/+/+/lamp/set_light_level");
  startSensorLoop();
});

client.on("error", (error: Error) => {
  console.error("❌ MQTT error in simulator", error);
});

client.on("message", (topic, rawPayload) => {
  try {
    const [_, farmId, rackId, row, column, actuator, action] = topic.split("/");
    const position = positions.find(
      (item) => item.rackId === rackId && item.row === Number.parseInt(row, 10) && item.column === Number.parseInt(column, 10)
    );

    if (!position) {
      return;
    }

    if (actuator === "water_pump" && action === "spray_water") {
      position.moisture = Math.min(100, position.moisture + 20);
      console.log(`💧 Water command applied to ${rackId}/${row}/${column} (moisture ${position.moisture.toFixed(1)}%)`);
    }

    if (actuator === "lamp" && action === "set_light_level") {
      const payload = JSON.parse(rawPayload.toString()) as { intensity?: number };
      position.lightLevel = payload.intensity ?? position.lightLevel;
      console.log(`💡 Light command applied to ${rackId}/${row}/${column} (level ${position.lightLevel.toFixed(1)}%)`);
    }
  } catch (error) {
    console.error("❌ Failed to process actuator message", error);
  }
});

function topicBase({ farmId, rackId, row, column }: TopicBuilderArgs): string {
  return `greengrow/${farmId}/${rackId}/${row}/${column}`;
}

function publishSensor(topic: string, payload: SensorPayload): void {
  client.publish(topic, JSON.stringify(payload));
}

function startSensorLoop(): void {
  setInterval(() => {
    for (const position of positions) {
      position.moisture = Math.max(0, position.moisture - Math.random() * 2);
      const farmId = env.FARM_ID;

      publishSensor(
        `${topicBase({ farmId, rackId: position.rackId, row: position.row, column: position.column })}/light_sensor/light_level`,
        { value: position.lightLevel, unit: "percent" }
      );

      publishSensor(
        `${topicBase({ farmId, rackId: position.rackId, row: position.row, column: position.column })}/moisture_sensor/moisture_level`,
        { value: position.moisture, unit: "percent" }
      );

      const health = position.moisture > 30 ? 80 + Math.random() * 20 : 40 + Math.random() * 20;
      publishSensor(
        `${topicBase({ farmId, rackId: position.rackId, row: position.row, column: position.column })}/color_camera/plant_color`,
        { value: Number.parseFloat(health.toFixed(1)), unit: "health_score" }
      );
    }
  }, env.PUBLISH_INTERVAL_MS);

  console.log(`📡 Sensors publishing every ${env.PUBLISH_INTERVAL_MS / 1000}s`);
}
