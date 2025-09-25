import { Rpc, RpcGroup } from "@effect/rpc";
import { Effect, Schema, Layer } from "effect";

export class HealthRpcs extends RpcGroup.make(
  Rpc.make("HealthCheck", { success: Schema.Boolean }),
) {}

export const HealthLive: Layer.Layer<Rpc.Handler<"HealthCheck">> =
  HealthRpcs.toLayer(
    Effect.gen(function* () {
      return {
        HealthCheck: () =>
          Effect.gen(function* () {
            return yield* Effect.succeed(true);
          }),
      };
    }),
  );
