import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#185FA5",
          50:  "#EEF5FB",
          100: "#D6E6F3",
          200: "#ADCCE6",
          300: "#7FAED6",
          400: "#4F8BC2",
          500: "#185FA5",
          600: "#134F8A",
          700: "#0F3F6E",
          800: "#0B3057",
          900: "#072039",
        },
        ink: {
          DEFAULT: "#111827",
          muted: "#6B7280",
          subtle: "#9CA3AF",
        },
        canvas: "#F5F7FA",
        line: "#E5E7EB",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,24,39,.04), 0 1px 8px rgba(17,24,39,.04)",
      },
    },
  },
  plugins: [],
};

export default config;
