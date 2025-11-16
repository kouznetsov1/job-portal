import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import {
  CompanyDetailed,
  CompanyId,
  CompanyRpcError,
  CompanySearchParams,
  CompanySearchResult,
} from "../schema/company";
import { CompanyJobsRequest, CompanyJobsResult } from "../schema/company-jobs";

export class CompanyRpcs extends RpcGroup.make(
  Rpc.make("company.search", {
    payload: CompanySearchParams,
    success: CompanySearchResult,
    error: CompanyRpcError,
  }),
  Rpc.make("company.getById", {
    payload: Schema.Struct({ id: CompanyId }),
    success: CompanyDetailed,
    error: CompanyRpcError,
  }),
  Rpc.make("company.getJobs", {
    payload: CompanyJobsRequest,
    success: CompanyJobsResult,
    error: CompanyRpcError,
  }),
) {}
