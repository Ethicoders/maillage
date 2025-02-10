/** @type {import('tailwindcss').Config} */

const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["./src/**/*.gleam"],
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        html: {
          minHeight: "100%",
          // fontSize: "14px",
        },
        body: {
          minHeight: "100%",
        },
      });
    }),
  ],
  theme: {
    extend: {
      borderColor: {
        "neutral-border": "#374151",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        mono: ["Fira Code", "monospace"],
        label: ["IBM Plex Mono"],
        "heading-3": ["IBM Plex Mono"],
        body: ["IBM Plex Mono"],
      },
      colors: {
        "default-font": "#f9fafb",
        "default-background": "rgb(3, 7, 18)",
        brand: {
          DEFAULT: "#30A46C",
          50: "#E6F8EF",
          100: "#D6F3E5",
          200: "#B6EAD1",
          300: "#97E0BD",
          400: "#77D7A9",
          500: "#58CE95",
          600: "#39C481",
          700: "#30A46C",
          800: "#23794F",
          900: "#174D33",
          950: "#103825",
        },
        "subtext-color": "#9ca3af",
      },
    },
  },
  // plugins: [require('daisyui')],
  // daisyui: {
  //   themes: ["light"],
  // },
};
