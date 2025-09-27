import { JobsLiveHandler } from "./handlers/job";
import { JobAdsLiveHandler } from "./handlers/jobads";
import { Layer } from "effect";
import { HealthLive } from "@repo/domain";

// Export just the handlers layer
export const RpcHandlers = Layer.mergeAll(JobsLiveHandler, JobAdsLiveHandler, HealthLive);
