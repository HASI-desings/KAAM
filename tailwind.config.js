/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: "#0F6659", light: "#1B8A76" },
        amber: { DEFAULT: "#E8A33D", light: "#F2C572" },
        success: "#3E8C5A",
        warning: "#D98C3F",
        danger: "#C1473B",
        bg: { light: "#FAFAF8", dark: "#121412" },
        text: { primary: "#1C1F1E", "primary-dark": "#F2F2EF", secondary: "#6B6F6C", "secondary-dark": "#A3A7A3" },
        border: { light: "#E3E3DF", dark: "#2A2D2A" }
      },
      borderRadius: { xl2: "12px" },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};
