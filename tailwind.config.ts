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
        chalk: "var(--chalk)",
        paper: "var(--paper)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        hairline: "var(--hairline)",
        signal: "var(--signal)",
        amber: "var(--amber)",
        lagoon: "var(--lagoon)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        data: "4px",
      },
      spacing: {
        "18": "72px",
      },
    },
  },
  plugins: [],
};
export default config;
