import { PrismaPg } from "@prisma/adapter-pg";
import type {
  PrismaPromise,
  UserModel,
} from "./generated/prisma/internal/prismaNamespace";
import { PrismaClient } from "./generated/prisma/client";
import { Config, ConfigProvider, Effect, Layer, Schema } from "effect";
import { DatabaseError } from "@repo/domain";

export class Database extends Effect.Service<Database>()("Database", {
  effect: Effect.gen(function* () {
    const connectionString = yield* Config.string("DATABASE_URL");
    const adapter = new PrismaPg({ connectionString });
    const client = new PrismaClient({ adapter });

    const use = <A>(f: (p: PrismaClient) => PrismaPromise<A>) =>
      Effect.fn("database.use")(function* () {
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
    };
  }),
}) {
  static readonly Live = Database.Default.pipe(
    Layer.provide(Layer.setConfigProvider(ConfigProvider.fromEnv())),
  );
}

const s = Schema.declare((u): u is UserModel => typeof u === "object", {
  identifier: "PrismaUser",
});
