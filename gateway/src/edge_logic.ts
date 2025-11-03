import { ReadColor, ReadLight, ReadMoisture } from "./sensor_controller";

export function getMoisturePercentage() {
    const rawValue = ReadMoisture();

    // convert 0-5 V  to 0-50% water (Arbitrary conversions since sensors are simulated, should fit data sheet in real scenario)
    const percentage = rawValue / 10;
    return percentage;
}

export function getLightLux() {
    const rawValue = ReadLight();

    // convert 0-5 V to 0-20k lux (Arbitrary conversions since sensors are simulated, should fit data sheet in real scenario)
    const lux = 20000 * (rawValue / 5)
    return lux;
}

export function getColorHexCode() {
    const toHex = (n: number) => {
        const hex = n.toString(16); // convert number to hex
        return hex.length === 1 ? "0" + hex : hex; // pad with 0 if needed
    };
    const rawValue = ReadColor();

    // convert 0-5 V to 0-255
    const convertColor = (value: number) => {
        return Math.round(255 * (value / 5));
    }

    // convert RBG to HexCode
    const hexCode = `#${toHex(convertColor(rawValue.r))}${toHex(convertColor(rawValue.b))}${toHex(convertColor(rawValue.g))}`;

    return hexCode;
}