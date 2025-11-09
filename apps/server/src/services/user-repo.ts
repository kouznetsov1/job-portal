import { Database } from "@repo/db";
import { UserId, UserNotFoundError, UserPublic } from "@repo/domain";
import { Effect } from "effect";

export class UserRepo extends Effect.Service<UserRepo>()("UserRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    const getUser = (userId: string) =>
      Effect.fn("userRepo.getUser")(function* () {
        const user = yield* db.use((client) =>
          client.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
            },
          })
        );

        if (!user) {
          return yield* Effect.fail(
            new UserNotFoundError({ id: UserId.make(userId) })
          );
        }

        return UserPublic.make({
          id: UserId.make(user.id),
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        });
      })();

    return {
      getUser,
    };
  }),
}) {}
