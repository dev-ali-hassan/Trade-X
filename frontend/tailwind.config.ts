import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050506",
        panel: "#111111",
        panelSoft: "#171717",
        line: "#2b2618",
        profit: "#22c55e",
        loss: "#ef4444",
        ai: "#d6a63a"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"]
      },
      boxShadow: {
        panel: "0 18px 45px rgba(0, 0, 0, 0.28)",
        glow: "0 0 0 1px rgba(214, 166, 58, 0.38), 0 0 32px rgba(214, 166, 58, 0.16)"
      }
    }
  },
  plugins: []
} satisfies Config;
