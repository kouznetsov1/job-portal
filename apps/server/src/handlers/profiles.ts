import { CurrentSession, ProfileRpcs } from "@repo/domain";
import { Effect } from "effect";
import { Profile } from "../services/profile-repo";

export const Profiles = ProfileRpcs.toLayer(
  Effect.gen(function* () {
    const profile = yield* Profile;

    return {
      "profile.get": () =>
        Effect.gen(function* () {
          const { userId } = yield* CurrentSession;
          return yield* profile.get(userId);
        }),

      "profile.update": (payload) =>
        Effect.gen(function* () {
          const { userId } = yield* CurrentSession;
          const updated = yield* profile.update(userId, payload);
          // TODO: Fork this so it runs in parallel without waiting
          yield* profile
            .generatePerfectJobDescription(userId)
            .pipe(Effect.catchAll(() => Effect.void));
          return updated;
        }),

      "profile.uploadCV": (payload) =>
        Effect.gen(function* () {
          const { userId } = yield* CurrentSession;
          return yield* profile.uploadCV(userId, payload);
        }),
    };
  }),
);
