import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxy = {
  "/api": {
    target: process.env.VITE_BACKEND || "http://localhost:5000",
    changeOrigin: true
  }
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy,
    allowedHosts: [".loca.lt", ".trycloudflare.com", ".ngrok-free.app", ".ngrok.io", ".devtunnels.ms"]
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy,
    allowedHosts: [".loca.lt", ".trycloudflare.com", ".ngrok-free.app", ".ngrok.io", ".devtunnels.ms"]
  }
});
