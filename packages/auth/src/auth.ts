import { Database } from "@repo/db";
import { AuthError, SessionNotFoundError } from "@repo/domain";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { google, linkedin } from "better-auth/social-providers";
import { Effect } from "effect";

export class Auth extends Effect.Service<Auth>()("Auth", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    const config: BetterAuthOptions = {
      database: prismaAdapter(db.client, {
        provider: "postgresql",
      }),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
      },
      socialProviders: {
        google: google({
          clientId: process.env.GOOGLE_CLIENT_ID || "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        linkedin: linkedin({
          clientId: process.env.LINKEDIN_CLIENT_ID || "",
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
        }),
      },
      trustedOrigins: ["http://localhost:3000"],
    };

    const auth = betterAuth(config);

    const getSession = (headers: Headers) =>
      Effect.gen(function* () {
        const session = yield* Effect.tryPromise({
          try: () => auth.api.getSession({ headers }),
          catch: (cause) =>
            new AuthError({ message: "Failed to get session", cause }),
        });

        if (!session) {
          return yield* Effect.fail(
            new SessionNotFoundError({ message: "No active session found" })
          );
        }

        return session;
      });

    const requireAuth = (headers: Headers) => getSession(headers);

    return {
      auth,
      getSession,
      requireAuth,
    };
  }),
}) {}
