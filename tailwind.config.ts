import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        slateSky: "#f3f7fb",
        deepBlue: "#0d2b45",
        lightBlue: "#c8deef",
        seaGreen: "#2d7f6f",
        mutedInk: "#3a4a5a"
      }
    }
  },
  plugins: []
};

export default config;
