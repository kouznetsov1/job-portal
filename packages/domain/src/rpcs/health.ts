import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";

export class HealthRpcs extends RpcGroup.make(
  Rpc.make("health", { success: Schema.Boolean }),
) {}
