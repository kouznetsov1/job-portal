import { HttpApiBuilder } from "@effect/platform";
import { Api } from "@repo/domain/Api";
import { Job } from "@repo/domain/Job";
import { Effect } from "effect";

export const JobGroupLive = HttpApiBuilder.group(Api, "job", (handlers) =>
  handlers.handle("get", () =>
    Effect.gen(function* () {
      const data: typeof Job.Type = {
        id: 2,
        name: "Montör",
      };
      yield* Effect.sleep("3 seconds");
      return data;
    }),
  ),
);
