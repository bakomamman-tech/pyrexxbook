import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL(".", import.meta.url));
  const env = loadEnv(mode, rootDir, "");
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || "http://localhost:5000";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": proxyTarget,
        "/uploads": proxyTarget,
        "/socket.io": {
          target: proxyTarget,
          ws: true
        }
      }
    }
  };
});
