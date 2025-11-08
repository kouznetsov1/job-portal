import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import { Job, JobId, JobRpcError, JobSearchParams } from "../schema/job";

export class JobSearchResult extends Schema.Class<JobSearchResult>(
  "JobSearchResult",
)({
  jobs: Schema.Array(Job),
  total: Schema.Number,
}) {}

export class JobsRpcs extends RpcGroup.make(
  Rpc.make("jobs.search", {
    payload: JobSearchParams,
    success: JobSearchResult,
    error: JobRpcError,
  }),
  Rpc.make("jobs.getById", {
    payload: Schema.Struct({ id: JobId }),
    success: Job,
    error: JobRpcError,
  }),
  Rpc.make("jobs.getSaved", {
    success: Schema.Array(Job),
    error: JobRpcError,
  }),
  Rpc.make("jobs.save", {
    payload: Schema.Struct({ jobId: JobId }),
    success: Schema.Boolean,
    error: JobRpcError,
  }),
  Rpc.make("jobs.unsave", {
    payload: Schema.Struct({ jobId: JobId }),
    success: Schema.Boolean,
    error: JobRpcError,
  }),
) {}
