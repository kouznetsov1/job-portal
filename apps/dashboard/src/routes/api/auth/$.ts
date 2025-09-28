import { Auth } from "@repo/auth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // return auth.handler({request})
        return new Response("hej");
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
