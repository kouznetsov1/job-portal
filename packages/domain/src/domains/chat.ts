import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";

export class AIChatError extends Schema.TaggedError<AIChatError>()(
  "AIChatError",
  {
    message: Schema.String,
  },
) {}

export const ChatRequest = Schema.Struct({
  message: Schema.String,
});
export type ChatRequest = Schema.Schema.Type<typeof ChatRequest>;

export class ChatRpcs extends RpcGroup.make(
  Rpc.make("chat.stream", {
    payload: ChatRequest,
    success: Schema.String,
    error: AIChatError,
    stream: true,
  }),
) {}
