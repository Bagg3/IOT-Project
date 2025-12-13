import { ReadColor, ReadLight, ReadMoisture } from "./sensor_controller";

export function getMoisturePercentage() {
    const rawValue = ReadMoisture();
    const percentage = rawValue / 10;
    return percentage;
}

export function getLightLux() {
    const rawValue = ReadLight();
    const lux = 20000 * (rawValue / 5)
    return lux;
}

export function getColorHexCode() {
    const toHex = (n: number) => {
        const hex = n.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    const rawValue = ReadColor();
    const convertColor = (value: number) => {
        return Math.round(255 * (value / 5));
    }
    const hexCode = `#${toHex(convertColor(rawValue.r))}${toHex(convertColor(rawValue.b))}${toHex(convertColor(rawValue.g))}`;

    return hexCode;
}