import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: "window", // needed by stompjs
  },
  server: {
    port: 5173,
    proxy: {
      // ✅ Proxy all websocket & SockJS calls to Spring Boot
      "/ws-telemetry": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true, // WebSocket proxy support
      },
      // ✅ Optional: if you also call REST APIs
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
