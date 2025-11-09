import {
  CurrentSession,
  JobRpcs,
  JobSearchResult,
} from "@repo/domain";
import { Effect } from "effect";
import { JobRepo } from "../services/job-repo";

export const Jobs = JobRpcs.toLayer(
  Effect.gen(function* () {
    const jobRepo = yield* JobRepo;

    return {
      "job.search": (params) =>
        Effect.gen(function* () {
          const maybeSession = yield* Effect.either(CurrentSession);
          const userId =
            maybeSession._tag === "Right" ? maybeSession.right.userId : undefined;

          const result = yield* jobRepo.search(params, userId)();
          return JobSearchResult.make(result);
        }),

      "job.getById": ({ id }) => jobRepo.getById(id)(),

      "job.getSaved": () =>
        Effect.gen(function* () {
          const { userId } = yield* CurrentSession;
          return yield* jobRepo.getSaved(userId)();
        }),

      "job.save": ({ jobId }) =>
        Effect.gen(function* () {
          const { userId } = yield* CurrentSession;
          return yield* jobRepo.save(userId, jobId)();
        }),

      "job.unsave": ({ jobId }) =>
        Effect.gen(function* () {
          const { userId } = yield* CurrentSession;
          return yield* jobRepo.unsave(userId, jobId)();
        }),
    };
  })
);
