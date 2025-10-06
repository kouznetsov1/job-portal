import { Data } from "effect";

export class AuthError extends Data.TaggedError("AuthError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class SessionNotFoundError extends Data.TaggedError(
  "SessionNotFoundError",
)<{
  readonly message: string;
}> {}
