import { RpcServer } from "@effect/rpc";
import { JobsRpcs } from "@repo/domain";
import { JobsLive } from "../handlers/job";
import { Layer } from "effect";
import {
  HealthLive,
  HealthRpcs,
} from "../../../packages/domain/src/rpcs/health";

const JobsLayer = RpcServer.layer(JobsRpcs).pipe(Layer.provide(JobsLive));
const HealthLayer = RpcServer.layer(HealthRpcs).pipe(Layer.provide(HealthLive));

export const RpcLayer = Layer.mergeAll(JobsLayer, HealthLayer);
