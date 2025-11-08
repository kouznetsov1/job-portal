import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import { Job, JobId, JobRpcError, JobSearchParams } from "../schema/job";

export class JobSearchResult extends Schema.Class<JobSearchResult>(
  "JobSearchResult",
)({
  jobs: Schema.Array(Job),
  total: Schema.Number,
}) {}

export class JobPublicRpcs extends RpcGroup.make(
  Rpc.make("job.search", {
    payload: JobSearchParams,
    success: JobSearchResult,
    error: JobRpcError,
  }),
  Rpc.make("job.getById", {
    payload: Schema.Struct({ id: JobId }),
    success: Job,
    error: JobRpcError,
  }),
) {}

export class JobAuthRpcs extends RpcGroup.make(
  Rpc.make("job.getSaved", {
    success: Schema.Array(Job),
    error: JobRpcError,
  }),
  Rpc.make("job.save", {
    payload: Schema.Struct({ jobId: JobId }),
    success: Schema.Boolean,
    error: JobRpcError,
  }),
  Rpc.make("job.unsave", {
    payload: Schema.Struct({ jobId: JobId }),
    success: Schema.Boolean,
    error: JobRpcError,
  }),
) {}

export const JobRpcs = JobPublicRpcs.merge(JobAuthRpcs);
