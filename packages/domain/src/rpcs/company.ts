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

export class CompanyRpcs extends RpcGroup.make(
  Rpc.make("companie.search", {
    payload: CompanySearchParams,
    success: CompanySearchResult,
    error: CompanyRpcError,
  }),
  Rpc.make("companie.getById", {
    payload: Schema.Struct({ id: CompanyId }),
    success: CompanyDetailed,
    error: CompanyRpcError,
  }),
  Rpc.make("companie.getJobs", {
    payload: CompanyJobsRequest,
    success: CompanyJobsResult,
    error: CompanyRpcError,
  }),
) {}
