import { assert, describe, it } from "@effect/vitest";
import { UserId, type UserNotFoundError } from "@repo/domain";
import { Effect } from "effect";
import { UserRepo } from "../user-repo";
import { createMockDatabase, MockSession, mockUser } from "./test-layers";

const MockDatabase = createMockDatabase(mockUser);
const MockDatabaseNotFound = createMockDatabase(null);

describe("UserRepo", () => {
  it.effect("getUser returns user with valid userId", () =>
    Effect.gen(function* () {
      const userRepo = yield* UserRepo;
      const result = yield* userRepo.getUser("test-user-id");

      assert.strictEqual(result.id, UserId.make("test-user-id"));
      assert.strictEqual(result.email, "test@example.com");
      assert.strictEqual(result.name, "Test User");
    }).pipe(Effect.provide(UserRepo.Default), Effect.provide(MockDatabase))
  );

  it.effect(
    "getUser fails with UserNotFoundError when user does not exist",
    () =>
      Effect.gen(function* () {
        const userRepo = yield* UserRepo;
        const result = yield* Effect.flip(userRepo.getUser("nonexistent-id"));

        assert.deepStrictEqual(result._tag, "UserNotFoundError");
        assert.deepStrictEqual(
          (result as UserNotFoundError).id,
          UserId.make("nonexistent-id")
        );
      }).pipe(
        Effect.provide(UserRepo.Default),
        Effect.provide(MockDatabaseNotFound)
      )
  );

  it.effect("getUser works with CurrentSession context", () =>
    Effect.gen(function* () {
      const userRepo = yield* UserRepo;
      const result = yield* userRepo.getUser("test-user-id");

      assert.strictEqual(result.id, UserId.make("test-user-id"));
      assert.strictEqual(result.email, "test@example.com");
    }).pipe(
      Effect.provide(UserRepo.Default),
      Effect.provide(MockDatabase),
      Effect.provide(MockSession)
    )
  );
});
