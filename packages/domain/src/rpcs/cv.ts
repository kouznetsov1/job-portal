import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import { Cv, CvChatMessage } from "../schemas/Cv";

export class CvRpcs extends RpcGroup.make(
  Rpc.make("cv.get", {
    success: Cv,
    error: Schema.String,
    payload: {
      userId: Schema.String,
    },
  }),
  Rpc.make("cv.chat", {
    success: Schema.String,
    error: Schema.String,
    payload: {
      cvId: Schema.String,
      userId: Schema.String,
      message: Schema.String,
    },
  }),
) {}
