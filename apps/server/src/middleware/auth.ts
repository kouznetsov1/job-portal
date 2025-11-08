import { AuthMiddleware } from "@repo/domain";
import { Auth } from "@repo/auth";
import { Effect, Layer } from "effect";
import { fromNodeHeaders } from "better-auth/node";

export const AuthMiddlewareLive = Layer.effect(
  AuthMiddleware,
  Effect.gen(function* () {
    const auth = yield* Auth;

    return AuthMiddleware.of(({ headers }) =>
      Effect.gen(function* () {
        const nodeHeaders = fromNodeHeaders(headers);
        const session = yield* auth.getSession(nodeHeaders);

        return {
          userId: session.user.id,
          email: session.user.email,
        };
      }),
    );
  }),
);
