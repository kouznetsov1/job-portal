import { Schema } from "effect";
import { CompanyDetailed, CompanyId } from "./company";
import { Job } from "./job";

export class CompanyJobsRequest extends Schema.Class<CompanyJobsRequest>(
  "CompanyJobsRequest"
)({
  companyId: CompanyId,
  page: Schema.optional(Schema.Number),
  pageSize: Schema.optional(Schema.Number),
}) {}

export class CompanyJobsResult extends Schema.Class<CompanyJobsResult>(
  "CompanyJobsResult"
)({
  company: CompanyDetailed,
  jobs: Schema.Array(Job),
  total: Schema.Number,
}) {}
