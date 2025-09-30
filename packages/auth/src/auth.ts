import { Database } from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Context, Data, Effect, Layer } from "effect";
import type { BetterAuthOptions } from "better-auth";

class AuthError extends Data.TaggedError("AuthError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

class SessionNotFoundError extends Data.TaggedError("SessionNotFoundError")<{
  readonly message: string;
}> {}

export class Auth extends Context.Tag("Auth")<
  Auth,
  ReturnType<typeof betterAuth>
>() {
  static readonly Live = Layer.effect(
    Auth,
    Effect.gen(function* () {
      const db = yield* Database;

      const config: BetterAuthOptions = {
        database: prismaAdapter(db, {
          provider: "postgresql",
        }),
        emailAndPassword: {
          enabled: true,
          requireEmailVerification: false,
        },
        trustedOrigins: ["http://localhost:3000"],
      };

      return betterAuth(config);
    })
  );

  static readonly getSession = (request: Request) =>
    Effect.gen(function* () {
      const auth = yield* Auth;
      const session = yield* Effect.tryPromise({
        try: () => auth.api.getSession({ headers: request.headers }),
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

  static readonly requireAuth = (request: Request) =>
    Auth.getSession(request).pipe(
      Effect.mapError((error) =>
        error._tag === "SessionNotFoundError"
          ? new AuthError({ message: "Authentication required" })
          : error
      )
    );
}

export { AuthError, SessionNotFoundError };
