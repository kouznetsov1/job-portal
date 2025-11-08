import { RpcMiddleware } from "@effect/rpc";
import { Context, Schema } from "effect";
import { AuthError, SessionNotFoundError } from "../schema/auth";

export class CurrentSession extends Context.Tag("CurrentSession")<
  CurrentSession,
  {
    readonly userId: string;
    readonly email: string;
  }
>() {}

export class AuthMiddleware extends RpcMiddleware.Tag<AuthMiddleware>()(
  "AuthMiddleware",
  {
    provides: CurrentSession,
    failure: Schema.Union(SessionNotFoundError, AuthError),
  },
) {}
