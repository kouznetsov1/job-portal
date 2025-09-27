import { Rpc } from "@effect/rpc";
import { Job } from "@repo/domain";
import { Console, Effect, Layer } from "effect";
import { JobsRpcs } from "@repo/domain";

export const JobsLiveHandler: Layer.Layer<Rpc.Handler<"job.get">> =
  JobsRpcs.toLayer(
    Effect.gen(function* () {
      return {
        "job.get": (input) =>
          Effect.gen(function* () {
            yield* Console.log("Start");
            yield* Effect.sleep("3 seconds");
            yield* Console.log("End");
            return yield* Effect.succeed<typeof Job.Type>({
              id: input.id,
              name: "Montör",
            });
          }),
      };
    }),
  );
