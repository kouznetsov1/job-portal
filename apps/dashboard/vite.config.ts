import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      customViteReactPlugin: true,
      target: "bun",
      spa: {
        enabled: true,
      },
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "#": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@repo/domain"],
  },
});
