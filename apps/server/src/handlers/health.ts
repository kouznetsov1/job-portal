import { HealthRpcs } from "@repo/domain";
import { Effect } from "effect";

export const Health = HealthRpcs.toLayer(
  Effect.gen(function* () {
    const health = () => Effect.succeed(true);

    return {
      health,
    };
  }),
);
