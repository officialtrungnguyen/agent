/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          50: "#f7f7f8",
          100: "#ececef",
          200: "#d5d6dc",
          300: "#b0b2bc",
          400: "#858894",
          500: "#666a76",
          600: "#52555f",
          700: "#43454d",
          800: "#3a3c42",
          900: "#1c1d21",
          950: "#121316",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
