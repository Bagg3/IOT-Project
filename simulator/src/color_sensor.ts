function getDayGradientColor(date = new Date()) {
    const lightGreen = { r: 144, g: 238, b: 144 };
    const darkGreen = { r: 0, g: 100, b: 0 };

    const day = date.getDate();

    const t = (day - 1) / (31 - 1);

    const r = Math.round(lightGreen.r + (darkGreen.r - lightGreen.r) * t);
    const g = Math.round(lightGreen.g + (darkGreen.g - lightGreen.g) * t);
    const b = Math.round(lightGreen.b + (darkGreen.b - lightGreen.b) * t);

    const r5v = (r / 255) * 5;
    const g5v = (g / 255) * 5;
    const b5v = (b / 255) * 5;

    const r5vWithNoise = r5v + ((Math.random() - 0.5) * 0.1 * r5v);
    const g5vWithNoise = g5v + ((Math.random() - 0.5) * 0.1 * g5v);
    const b5vWithNoise = b5v + ((Math.random() - 0.5) * 0.1 * b5v);

    const rValue = Math.max(0, Math.min(5, r5vWithNoise));
    const gValue = Math.max(0, Math.min(5, g5vWithNoise));
    const bValue = Math.max(0, Math.min(5, b5vWithNoise));

    return { rValue, gValue, bValue };
}

const colorRGB = getDayGradientColor()

console.log(colorRGB.rValue)
console.log(colorRGB.bValue)
console.log(colorRGB.gValue)
