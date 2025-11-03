import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9f1",
          100: "#d5f1dd",
          200: "#ace3be",
          300: "#7fd49d",
          400: "#4fc57d",
          500: "#2dab62",
          600: "#208752",
          700: "#196842",
          800: "#134d32",
          900: "#0c3222"
        }
      }
    }
  }
};

export default config;
