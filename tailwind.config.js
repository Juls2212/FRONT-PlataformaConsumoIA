/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./services/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#08121d",
        ocean: "#0f3d5e",
        mist: "#edf4f7",
        sand: "#f6efe5",
        coral: "#f28f6b",
        mint: "#6dc7b0"
      },
      boxShadow: {
        panel: "0 18px 60px rgba(8, 18, 29, 0.12)"
      }
    }
  },
  plugins: []
};
