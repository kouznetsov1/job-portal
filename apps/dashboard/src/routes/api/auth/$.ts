import { Auth } from "@repo/auth";
import { createFileRoute } from "@tanstack/react-router";
import { runAuth } from "@/lib/auth.server";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const auth = await runAuth(Auth);
        return auth.handler(request);
      },
      POST: async ({ request }: { request: Request }) => {
        const auth = await runAuth(Auth);
        return auth.handler(request);
      },
    },
  },
});
