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
  chatId: Schema.optional(Schema.String),
});
export type ChatRequest = Schema.Schema.Type<typeof ChatRequest>;

export const ChatStreamChunk = Schema.Struct({
  content: Schema.String,
});
export type ChatStreamChunk = Schema.Schema.Type<typeof ChatStreamChunk>;

export class ChatRpcs extends RpcGroup.make(
  Rpc.make("chat.stream", {
    payload: ChatRequest,
    success: ChatStreamChunk,
    error: AIChatError,
    stream: true,
  }),
) {}
