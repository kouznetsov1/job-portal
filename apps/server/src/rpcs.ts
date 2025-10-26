import { Layer } from "effect";
import { HealthLive } from "@repo/domain";
import { ChatLiveHandler } from "./domains/chat";
import { JobsLiveHandler } from "./domains/jobs";

export const RpcHandlers = Layer.mergeAll(
  JobsLiveHandler,
  HealthLive,
  ChatLiveHandler,
);
