import { Database } from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Effect } from "effect";

export class Auth extends Effect.Service<Auth>()("Auth", {
  effect: Effect.gen(function* () {
    const db = yield* Database;
    const auth = betterAuth({
      database: prismaAdapter(db, {
        provider: "postgresql",
      }),
      emailAndPassword: {
        enabled: true,
      },
    });

    return auth;
  }),
}) {}
