import { Auth } from "@repo/auth";
import { Database } from "@repo/db";
import { ConfigProvider, Effect, Layer } from "effect";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const makeAuthLayer = createServerOnlyFn(() => {
  const DatabaseLayer = Database.Default.pipe(
    Layer.provide(
      Layer.setConfigProvider(
        ConfigProvider.fromMap(
          new Map([["DATABASE_URL", process.env.DATABASE_URL]]),
        ),
      ),
    ),
  );
  return Auth.Live.pipe(Layer.provide(DatabaseLayer));
});

export const runAuth = createServerOnlyFn(
  <E, A>(effect: Effect.Effect<A, E, Auth>) =>
    Effect.runPromise(effect.pipe(Effect.provide(makeAuthLayer()))),
);

export const isAuthenticated = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    console.log("request", request);
    if (!request?.headers) return null;

    const auth = await runAuth(Auth);
    const session = await auth.api.getSession({ headers: request.headers });
    console.log("session", session);
    return session ? true : false;
  },
);

export const getAuthenticatedUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    if (!request?.headers) return null;

    const auth = await runAuth(Auth);
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user ?? null;
  },
);
