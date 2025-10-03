import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import { Cv, CvChatMessage } from "../schemas/Cv";

const ChatMessageChunk = Schema.Struct({
  type: Schema.Literal("text", "tool_use", "assistant_message"),
  content: Schema.String,
  toolName: Schema.optional(Schema.String),
  toolInput: Schema.optional(Schema.Unknown),
});

export class CvRpcs extends RpcGroup.make(
  Rpc.make("cv.get", {
    success: Cv,
    error: Schema.String,
    payload: {
      userId: Schema.String,
    },
  }),
  Rpc.make("cv.chat", {
    success: ChatMessageChunk,
    error: Schema.String,
    payload: {
      cvId: Schema.String,
      userId: Schema.String,
      message: Schema.String,
    },
    stream: true,
  }),
  Rpc.make("cv.getChatHistory", {
    success: Schema.Array(CvChatMessage),
    error: Schema.String,
    payload: {
      cvId: Schema.String,
    },
  }),
) {}
