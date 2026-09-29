import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        twm: {
          navy: {
            50: "#f0f4f9",
            100: "#dbe5f2",
            200: "#b9cee4",
            300: "#8eb0d2",
            400: "#5e8ebd",
            500: "#3d71a7",
            600: "#2b5687",
            700: "#21436b",
            800: "#132842",
            900: "#0b1728",
            950: "#060d17",
          },
          gold: {
            50: "#fffbeb",
            100: "#fef3c7",
            200: "#fde68a",
            300: "#fcd34d",
            400: "#fbbf24",
            500: "#f59e0b",
            600: "#d97706",
            700: "#b45309",
            800: "#92400e",
            900: "#78350f",
          },
          emerald: {
            500: "#10b981",
            600: "#059669",
            700: "#047857",
          },
          ruby: {
            500: "#ef4444",
            600: "#dc2626",
            700: "#b91c1c",
          },
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
