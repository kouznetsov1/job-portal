import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";

export const Job = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
});

export class JobsRpcs extends RpcGroup.make(
  Rpc.make("job.get", {
    success: Job,
    error: Schema.String,
    payload: {
      id: Schema.Number,
    },
  }),
) {}
