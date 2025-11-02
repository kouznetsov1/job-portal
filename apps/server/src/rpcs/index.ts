import { Layer } from "effect";
import { HealthLive } from "@repo/domain";
import { JobsLiveHandler } from "./jobs";

export const RpcHandlers = Layer.mergeAll(JobsLiveHandler, HealthLive);
