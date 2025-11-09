import { Auth } from "@repo/auth";
import { AuthMiddleware } from "@repo/domain";
import { fromNodeHeaders } from "better-auth/node";
import { Effect, Layer } from "effect";

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
      })
    );
  })
);
