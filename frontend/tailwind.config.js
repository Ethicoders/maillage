/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.gleam"],
  theme: {
    extend: {
      colors: {
        "default-background": "rgb(3, 7, 18)",
        brand: {
          50: "#effaf3",
          100: "#d8f3e1",
          200: "#b4e6c7",
          300: "#83d2a7",
          400: "#50b781",
          500: "#30a46c",
          600: "#1e7d51",
          700: "#186442",
          800: "#164f36",
          900: "#13412e",
          950: "#09251a",
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
