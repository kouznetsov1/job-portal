import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import {
  CompanyDetailed,
  CompanyId,
  CompanyJobsRequest,
  CompanyJobsResult,
  CompanyRpcError,
  CompanySearchParams,
  CompanySearchResult,
} from "../schema/company";

export class CompaniesRpcs extends RpcGroup.make(
  Rpc.make("companies.search", {
    payload: CompanySearchParams,
    success: CompanySearchResult,
    error: CompanyRpcError,
  }),
  Rpc.make("companies.getById", {
    payload: Schema.Struct({ id: CompanyId }),
    success: CompanyDetailed,
    error: CompanyRpcError,
  }),
  Rpc.make("companies.getJobs", {
    payload: CompanyJobsRequest,
    success: CompanyJobsResult,
    error: CompanyRpcError,
  }),
) {}
