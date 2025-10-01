import { Auth } from "@repo/auth";
import { Database } from "@repo/db";
import { createFileRoute } from "@tanstack/react-router";
import { ConfigProvider, Effect, Layer, Schema } from "effect";

const DatabaseUrlSchema = Schema.String.pipe(Schema.nonEmptyString());

const makeAuthLayer = (databaseUrl: string) => {
  const DatabaseLayer = Database.Default.pipe(
    Layer.provide(
      Layer.setConfigProvider(
        ConfigProvider.fromMap(new Map([["DATABASE_URL", databaseUrl]])),
      ),
    ),
  );
  return Auth.Live.pipe(Layer.provide(DatabaseLayer));
};

const runAuth = <E, A>(
  effect: Effect.Effect<A, E, Auth>,
  databaseUrl: string,
) => Effect.runPromise(effect.pipe(Effect.provide(makeAuthLayer(databaseUrl))));

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const databaseUrl = Schema.decodeUnknownSync(DatabaseUrlSchema)(
          process.env.DATABASE_URL,
        );
        const auth = await runAuth(Auth, databaseUrl);
        return auth.handler(request);
      },
      POST: async ({ request }: { request: Request }) => {
        const databaseUrl = Schema.decodeUnknownSync(DatabaseUrlSchema)(
          process.env.DATABASE_URL,
        );
        const auth = await runAuth(Auth, databaseUrl);
        return auth.handler(request);
      },
    },
  },
});
