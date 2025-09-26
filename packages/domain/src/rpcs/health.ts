import { Rpc, RpcGroup } from "@effect/rpc";
import { Effect, Schema, Layer } from "effect";

export class HealthRpcs extends RpcGroup.make(
  Rpc.make("health", { success: Schema.Boolean }),
) {}

export const HealthLive: Layer.Layer<Rpc.Handler<"health">> =
  HealthRpcs.toLayer(
    Effect.gen(function* () {
      return {
        health: () =>
          Effect.gen(function* () {
            return yield* Effect.succeed(true);
          }),
      };
    }),
  );
