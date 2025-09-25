import { Rpc } from "@effect/rpc";
import { Job } from "@repo/domain/Job";
import { Effect, Layer } from "effect";
import { JobsRpcs } from "../rpcs/job";

export const JobsLive: Layer.Layer<Rpc.Handler<"GetJob">> = JobsRpcs.toLayer(
  Effect.gen(function* () {
    return {
      GetJob: () =>
        Effect.gen(function* () {
          yield* Effect.sleep(3);
          return yield* Effect.succeed<typeof Job.Type>({
            id: 2,
            name: "Montör",
          });
        }),
    };
  }),
);
