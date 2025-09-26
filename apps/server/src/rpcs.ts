import { RpcServer } from "@effect/rpc";
import { JobsLiveHandler } from "./handlers/job";
import { Layer } from "effect";
import { HealthLive, Rpcs } from "@repo/domain";

// Create a single layer with the merged group
export const RpcLayer = RpcServer.layer(Rpcs).pipe(
  Layer.provide(Layer.mergeAll(JobsLiveHandler, HealthLive)),
);
