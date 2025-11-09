import { Database } from "@repo/db";
import { CurrentSession } from "@repo/domain";
import { Layer } from "effect";

export const createMockDatabase = Database.Mock;

export const createMockSession = (userId: string, email: string) =>
  Layer.succeed(CurrentSession, {
    userId,
    email,
  });

export const MockSession = createMockSession(
  "test-user-id",
  "test@example.com"
);

export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date("2024-01-01"),
};
