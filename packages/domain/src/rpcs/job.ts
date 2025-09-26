import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import { Job } from "../schemas/Job";

export class JobsRpcs extends RpcGroup.make(
  Rpc.make("job.get", {
    success: Job,
    error: Schema.String,
    payload: {
      id: Schema.Number,
    },
  }),
) {}
