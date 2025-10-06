import { JobsLiveHandler } from "./domains/job";
import { JobAdsLiveHandler } from "./domains/jobads";
import { Layer } from "effect";
import { HealthLive } from "@repo/domain";
import { Database } from "@repo/db";

// Export just the handlers layer
export const RpcHandlers = Layer.mergeAll(
  JobsLiveHandler,
  JobAdsLiveHandler,
  HealthLive,
).pipe(Layer.provide(Layer.mergeAll(Database.Live)));
