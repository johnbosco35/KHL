import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // 8080 matches the API's default CORS_ORIGIN/APP_URL (server/.env).
  server: { port: 8080 },
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
});
