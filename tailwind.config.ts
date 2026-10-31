import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#111827",
          800: "#1E293B",
          900: "#0F172A",
        },
        brand: {
          DEFAULT: "#6366F1",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        mastered: {
          DEFAULT: "#10B981",
          50: "#ECFDF5",
          100: "#D1FAE5",
          600: "#059669",
        },
        progress: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          100: "#FEF3C7",
          600: "#D97706",
        },
        attention: {
          DEFAULT: "#EF4444",
          50: "#FEF2F2",
          100: "#FEE2E2",
          600: "#DC2626",
        },
        surface: {
          DEFAULT: "#F8FAFC",
          card: "#FFFFFF",
          subtle: "#F1F5F9",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Hind Siliguri", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Plus Jakarta Sans", "Hind Siliguri", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 12px -2px rgba(17, 24, 39, 0.06), 0 1px 3px -1px rgba(17, 24, 39, 0.04)",
        card: "0 4px 20px -2px rgba(17, 24, 39, 0.05), 0 1px 4px -1px rgba(17, 24, 39, 0.03)",
        glow: "0 0 24px -4px rgba(99, 102, 241, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;

