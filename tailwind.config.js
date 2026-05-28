/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        graphite: {
          50: "#f7f8f9",
          100: "#eef0f2",
          200: "#dfe2e6",
          300: "#c4c9d0",
          400: "#9aa2ad",
          500: "#6c7480",
          600: "#4a525d",
          700: "#343b45",
          800: "#22272e",
          900: "#13171c",
          950: "#0a0d11",
        },
        accent: {
          DEFAULT: "#0f172a",
          ink: "#0b0f17",
        },
        amber: {
          flag: "#b45309",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      letterSpacing: {
        micro: "0.14em",
      },
      borderRadius: {
        sharp: "2px",
      },
      boxShadow: {
        hair: "0 1px 0 0 rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};
