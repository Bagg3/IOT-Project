import mqtt from "mqtt";
import { config } from "./config/env";
import { handleCommand, handleCommandParamsSchema } from "./actuator_controller";
import { getColorHexCode, getLightLux, getMoisturePercentage } from "./edge_logic";

const mqttClient = mqtt.connect(config.MQTT_URL);

mqttClient.on("connect", () => {
    console.log(`Gateway connected to MQTT broker at ${config.MQTT_URL}`);

    const waterPumpTopicPattern = `greengrow/+/+/+/+/water_pump/+`;

    mqttClient.subscribe(waterPumpTopicPattern, (error: Error | null) => {
        if (error) {
            console.error("Failed to subscribe to topic", error);
        } else {
            console.log(`Subscribed to ${waterPumpTopicPattern}`);
        }
    });
    const lampTopicPattern = `greengrow/+/+/+/+/lamp/+`;
    mqttClient.subscribe(lampTopicPattern, (error: Error | null) => {
        if (error) {
            console.error("Failed to subscribe to topic", error);
        } else {
            console.log(`Subscribed to ${lampTopicPattern}`);
        }
    });
});

mqttClient.on("error", (error: Error) => {
    console.error("MQTT error", error);
});

mqttClient.on("message", async (topic, payload) => {
    console.log(`Received MQTT message on topic ${topic}: ${payload.toString()}`);
    try {
        const parts = topic.split("/");
        if (parts.length !== 7) {
            console.warn(`Invalid topic structure: ${topic}`);
            return;
        }

        const [, farmId, rackId, row, column, actuator, action] = parts;

        console.log(`Gateway config: FARM_ID=${config.FARM_ID}, RACK_ID=${config.RACK_ID}`);
        console.log(`Message for: farmId=${farmId}, rackId=${rackId}, row=${row}, col=${column}`);

        // Parse structured payload
        const payloadData = JSON.parse(payload.toString());
        
        // Extract value from the payload
        const value: number = typeof payloadData.value === "number" 
            ? payloadData.value 
            : (typeof payloadData === "number" ? payloadData : 5);

        const receivedParams = {
            row,
            column,
            action: payloadData.action || action,
            actuator,
            value
        };

        const parsed = handleCommandParamsSchema.safeParse(receivedParams);

        if (!parsed.success) {
            console.error("Invalid CommandParams", parsed.error.flatten());
            throw new Error("Invalid CommandParams");
        }

        console.log(`Executing command: ${actuator} ${payloadData.action || action} with value ${value}`);
        handleCommand(parsed.data);

    } catch (error) {
        console.error("Failed to handle MQTT message", error);
    }
});


async function pollSensors(): Promise<void> {
    const BaseTopicPattern = `greengrow/${config.FARM_ID}/${config.RACK_ID}`;

    try {
        for (let row = 1; row < 6; row++) {
            for (let column = 1; column < 6; column++) {
                const topicMoisture = `${BaseTopicPattern}/${row}/${column}/moisture_sensor/moisture_level`;
                const topicLight = `${BaseTopicPattern}/${row}/${column}/light_sensor/light_level`;
                const topicColor = `${BaseTopicPattern}/${row}/${column}/color_camera/plant_color`;

                const moistureData = { measurement: "moisture_level", value: getMoisturePercentage() };
                const lightData = { measurement: "light_level", value: getLightLux() };
                const colorData = { measurement: "plant_color", value: getColorHexCode() };

                mqttClient.publish(topicMoisture, JSON.stringify(moistureData));
                mqttClient.publish(topicLight, JSON.stringify(lightData));
                mqttClient.publish(topicColor, JSON.stringify(colorData));

                console.log(`Published sensor readings - Moisture: ${JSON.stringify(moistureData)}, Light: ${JSON.stringify(lightData)}, Color: ${JSON.stringify(colorData)}`);
            }
        }
    } catch (error) {
        console.error("Error while polling sensors", error);
    }
}

setInterval(pollSensors, config.POLL_INTERVAL_MS);

void pollSensors();