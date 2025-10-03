import { PrismaPg } from "@prisma/adapter-pg";
import type { PrismaPromise } from "./generated/prisma/internal/prismaNamespace";
import { PrismaClient } from "./generated/prisma/client";
import { Config, ConfigProvider, Data, Effect, Layer } from "effect";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  message: string;
  cause?: unknown;
}> {}

export class Database extends Effect.Service<Database>()("Database", {
  effect: Effect.gen(function* () {
    const connectionString = yield* Config.string("DATABASE_URL");
    const adapter = new PrismaPg({ connectionString });
    const client = new PrismaClient({ adapter });

    const use = <A>(f: (p: PrismaClient) => PrismaPromise<A>) =>
      Effect.fn("databaseUse")(function* () {
        return yield* Effect.tryPromise({
          try: () => f(client),
          catch: (error) =>
            new DatabaseError({
              message: error instanceof Error ? error.message : String(error),
              cause: error,
            }),
        });
      })();

    return {
      client,
      use,
    } as const;
  }),
}) {
  static readonly Live = Database.Default.pipe(
    Layer.provide(Layer.setConfigProvider(ConfigProvider.fromEnv())),
  );
}
