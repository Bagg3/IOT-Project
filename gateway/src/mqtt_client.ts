import mqtt from "mqtt";
import { config } from "./config/env";
import { handleCommand, handleCommandParamsSchema } from "./actuator_controller";
import { getColorHexCode, getLightLux, getMoisturePercentage } from "./edge_logic";

const mqttClient = mqtt.connect(config.MQTT_URL);

mqttClient.on("connect", () => {
    const actuatorTopicPattern = `greengrow/${config.FARM_ID}/${config.RACK_ID}/+/+/+/+`;
    console.log(`🔌 Gateway connected to MQTT broker at ${config.MQTT_URL}`);
    mqttClient.subscribe(actuatorTopicPattern, (error: Error | null) => {
        if (error) {
            console.error("Failed to subscribe to topic", error);
        } else {
            console.log(`Subscribed to ${actuatorTopicPattern}`);
        }
    });
});

mqttClient.on("error", (error: Error) => {
    console.error("MQTT error", error);
});

mqttClient.on("message", async (topic, payload) => {
    try {
        const parts = topic.split("/");
        if (parts.length !== 7) {
            return;
        }

        const [, , , row, column, actuator, action] = parts;
        const value = JSON.parse(payload.toString());

        const receivedParams = {
            row,
            column,
            action,
            actuator,
            value
        };

        const parsed = handleCommandParamsSchema.safeParse(receivedParams);

        if (!parsed.success) {
            console.error("Invalid CommandParams", parsed.error.flatten());
            throw new Error("Invalid CommandParams");
        }

        handleCommand(parsed.data);


    } catch (error) {
        console.error("Failed to handle MQTT message", error);
    }
});


async function pollSensors(): Promise<void> {
    const BaseTopicPattern = `greengrow/${config.FARM_ID}/${config.RACK_ID}`;

    try {
        for (let row = 0; row < 5; row++) {
            for (let column = 0; column < 5; column++) {
                const topicMositure = `${BaseTopicPattern}/${row}/${column}/moisture_sensor/moisture_level`;
                const topicLight = `${BaseTopicPattern}/${row}/${column}/light_sensor/light_level`;
                const topicColor = `${BaseTopicPattern}/${row}/${column}/color_camera/plant_color`;

                mqttClient.publish(topicMositure, JSON.stringify(getMoisturePercentage()));
                mqttClient.publish(topicLight, JSON.stringify(getLightLux()));
                mqttClient.publish(topicColor, JSON.stringify(getColorHexCode()));

                console.log(`Published command sensor readings to topics: ${topicMositure}, ${topicLight}, ${topicColor}`);
            }
        }
    } catch (error) {
        console.error("Error while polling sensors", error);
    }
}

setInterval(pollSensors, config.POLL_INTERVAL_MS);

void pollSensors();