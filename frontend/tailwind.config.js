/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16232a",
        paper: "#eef1ea",
        accent: "#146b5e",
      },
    },
  },
  plugins: [],
};
