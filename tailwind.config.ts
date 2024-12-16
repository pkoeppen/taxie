import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Helvetica Neue'",
          "Arial",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "'Courier New'",
          "Courier",
          "'Lucida Console'",
          "Monaco",
          "'Liberation Mono'",
          "'DejaVu Sans Mono'",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
  safelist: [],
} satisfies Config;
