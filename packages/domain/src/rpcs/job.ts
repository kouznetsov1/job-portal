import { Rpc, RpcGroup } from "@effect/rpc";
import { Job } from "@repo/domain/Job";
import { Schema } from "effect";

export class JobsRpcs extends RpcGroup.make(
  Rpc.make("GetJob", {
    success: Job,
    error: Schema.String,
    payload: {
      id: Schema.Number,
    },
  }),
) {}
