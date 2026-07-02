import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: mode === "github-pages" ? "/Trade-X/" : "/",
  plugins: [react()],
  server: {
    port: 5173
  }
}));
