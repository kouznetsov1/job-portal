import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  return {
    plugins: [tsConfigPaths(), tanstackStart(), react(), tailwindcss()],
    resolve: {
      alias: {
        "#": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "process.env.DATABASE_URL": JSON.stringify(env.DATABASE_URL),
      "process.env.BETTER_AUTH_SECRET": JSON.stringify(env.BETTER_AUTH_SECRET),
    },
    ssr: {
      noExternal: ["@repo/db", "@repo/auth"],
    },
  };
});
