import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma";
import { Config, ConfigProvider, Effect } from "effect";

export class Database extends Effect.Service<Database>()("Database", {
  effect: Effect.gen(function* () {
    const connectionString = yield* Config.string("DATABASE_URL");
    const adapter = new PrismaPg({ connectionString });
    const client = new PrismaClient({ adapter });

    return client;
  }).pipe(Effect.withConfigProvider(ConfigProvider.fromEnv())),
}) {}
