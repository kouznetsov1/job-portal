import { Schema } from "effect";
import { AuthError, SessionNotFoundError } from "./auth";
import { DatabaseError } from "./database";

export const UserId = Schema.String.pipe(Schema.brand("UserId"));

export class UserPublic extends Schema.Class<UserPublic>("UserPublic")({
  id: UserId,
  email: Schema.String,
  name: Schema.String.pipe(Schema.minLength(2)),
  createdAt: Schema.Date,
}) {}

export class UserNotFoundError extends Schema.TaggedError<UserNotFoundError>()(
  "UserNotFoundError",
  { id: UserId }
) {}

export const UserRpcError = Schema.Union(
  UserNotFoundError,
  SessionNotFoundError,
  AuthError,
  DatabaseError
);
