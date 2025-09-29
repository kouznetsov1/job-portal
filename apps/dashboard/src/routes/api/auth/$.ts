import { ApiClient } from "@/lib/rpc-client";
import { Auth } from "@repo/auth";
import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const func = Effect.fn(function* () {
          const auth = yield* Auth;
          const client = yield* ApiClient;
          return new Request("Hej");
        });
      },
      POST: async ({ request }) => {
        // How do we make this effectful and yield the Auth service?
        // return auth.handler({request})
        return new Response("hej");
      },
    },
  },
  // GET: ({ request }) => {
  //   return auth.handler(request);
  // },
  // POST: ({ request }) => {
  //   return auth.handler(request);
  // },
});
