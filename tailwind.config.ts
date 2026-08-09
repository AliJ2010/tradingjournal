import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#08090f",
          panel: "#12131e",
          panel2: "#191b2a",
          border: "#252842",
          text: "#f5f6fb",
          muted: "#8d90ab",
        },
        pill: {
          red: { bg: "#ef4444", text: "#fff1f2" },
          green: { bg: "#10b981", text: "#ecfdf5" },
          blue: { bg: "#3b82f6", text: "#eff6ff" },
          orange: { bg: "#f97316", text: "#fff7ed" },
          gold: { bg: "#eab308", text: "#fefce8" },
          slate: { bg: "#64748b", text: "#f1f5f9" },
          purple: { bg: "#a855f7", text: "#faf5ff" },
          teal: { bg: "#14b8a6", text: "#f0fdfa" },
        },
        accent: {
          DEFAULT: "#7c5cff",
          2: "#22d3ee",
          dim: "#4c3a99",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Inter", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7c5cff 0%, #22d3ee 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, rgba(124,92,255,0.16) 0%, rgba(34,211,238,0.10) 100%)",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.45)",
        glow: "0 0 0 1px rgba(124,92,255,0.4), 0 0 28px -6px rgba(124,92,255,0.55)",
        glowCyan: "0 0 0 1px rgba(34,211,238,0.35), 0 0 28px -6px rgba(34,211,238,0.5)",
      },
      keyframes: {
        "slide-in": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "float-glow": {
          "0%, 100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(20px,-16px)" },
        },
      },
      animation: {
        "float-glow": "float-glow 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
