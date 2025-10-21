import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  Object.assign(process.env, env);

  return {
    plugins: [tsConfigPaths(), tanstackStart(), react(), tailwindcss()],
    resolve: {
      alias: {
        "#": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ["@repo/domain"],
    },
  };
});
