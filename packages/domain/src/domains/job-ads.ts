import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import { Job } from "./job";

export const JobAdSearchParams = Schema.Struct({
  q: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.Number),
});

export class JobAdsRpcs extends RpcGroup.make(
  Rpc.make("jobads.search", {
    success: Schema.Array(Job),
    error: Schema.Unknown,
    payload: JobAdSearchParams,
  }),
  Rpc.make("jobads.getById", {
    success: Schema.Array(Job),
    error: Schema.Unknown,
    payload: {
      id: Schema.String,
    },
  }),
) {}
