import { CurrentSession, UserRpcs } from "@repo/domain";
import { Effect } from "effect";
import { UserRepo } from "../services/user-repo";

export const User = UserRpcs.toLayer(
  Effect.gen(function* () {
    const userRepo = yield* UserRepo;

    return {
      "user.getCurrentUser": () =>
        Effect.gen(function* () {
          const { userId } = yield* CurrentSession;
          return yield* userRepo.getUser(userId);
        }),
    };
  })
);
