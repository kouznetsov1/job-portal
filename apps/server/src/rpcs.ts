import { JobsLiveHandler } from "./domains/jobs";
import { Layer } from "effect";
import { HealthLive } from "@repo/domain";

export const RpcHandlers = Layer.mergeAll(JobsLiveHandler, HealthLive);
