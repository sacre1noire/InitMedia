/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef1ff",
          100: "#dfe5ff",
          200: "#cfd8ff",
          300: "#c0caff",
          400: "#a5b2f2",
          500: "#8494db",
          600: "#6174bf",
          700: "#3f558f",
          800: "#283f68",
          900: "#1a3054",
        },
      },
    },
  },
  plugins: [],
};
