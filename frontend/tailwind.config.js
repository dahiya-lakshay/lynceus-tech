/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ledger: {
          950: "#05070C",
          900: "#0A0E17",
          800: "#111827",
          700: "#1A2333",
          600: "#293246",
          500: "#3C4863",
        },
        signal: {
          amber: "#F5A623",
          amberDim: "#8A6320",
        },
        clear: {
          teal: "#2DD4BF",
          tealDim: "#1B7A6E",
        },
        alert: {
          red: "#EF4444",
        },
        slate: {
          50: "#F4F6FA",
          200: "#C7CEDC",
          400: "#8B95AB",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(245, 166, 35, 0.35)",
        glowTeal: "0 0 40px -10px rgba(45, 212, 191, 0.35)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "36px 36px",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: 0.6 },
          "50%": { opacity: 1 },
        },
        sweep: {
          "0%": { transform: "rotate(-90deg)" },
          "100%": { transform: "rotate(90deg)" },
        },
      },
      animation: {
        ticker: "ticker 40s linear infinite",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
