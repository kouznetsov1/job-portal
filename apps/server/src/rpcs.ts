import { JobsLiveHandler } from "./handlers/job";
import { JobAdsLiveHandler } from "./handlers/jobads";
import { CvLiveHandler } from "./handlers/cv";
import { Layer } from "effect";
import { HealthLive } from "@repo/domain";
import { Database } from "@repo/db";
import { ClaudeAgentService } from "./services/ClaudeAgentService";

// Export just the handlers layer
export const RpcHandlers = Layer.mergeAll(
  JobsLiveHandler,
  JobAdsLiveHandler,
  CvLiveHandler,
  HealthLive,
).pipe(Layer.provide(Layer.mergeAll(Database.Live, ClaudeAgentService.Default)));
