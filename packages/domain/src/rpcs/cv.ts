import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import { Cv, CvChatMessage } from "../schemas/Cv";
import { DatabaseError } from "../schemas/Database";

const ChatMessageChunk = Schema.Struct({
  type: Schema.Literal("text", "tool_use", "assistant_message"),
  content: Schema.String,
  toolName: Schema.optional(Schema.String),
  toolInput: Schema.optional(Schema.Unknown),
});

export class CvRpcs extends RpcGroup.make(
  Rpc.make("cv.get", {
    success: Cv,
    payload: {
      userId: Schema.String,
    },
    error: Schema.Union(Schema.String, DatabaseError),
  }),
  Rpc.make("cv.chat", {
    success: ChatMessageChunk,
    payload: {
      cvId: Schema.String,
      userId: Schema.String,
      message: Schema.String,
    },
    stream: true,
  }),
  Rpc.make("cv.getChatHistory", {
    success: Schema.Array(CvChatMessage),
    payload: {
      cvId: Schema.String,
    },
  }),
) {}
