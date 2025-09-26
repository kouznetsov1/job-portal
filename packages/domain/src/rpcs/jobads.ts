import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import { JobAd, SearchResults, TypeaheadResults } from "../schemas/JobAd";
import {
  JobAdSearchParams,
  TypeaheadParams,
} from "../schemas/JobAdSearchParams";

export class JobAdsRpcs extends RpcGroup.make(
  Rpc.make("jobads.search", {
    success: SearchResults,
    error: Schema.Unknown,
    payload: JobAdSearchParams,
  }),
  Rpc.make("jobads.getById", {
    success: JobAd,
    error: Schema.Unknown,
    payload: {
      id: Schema.String,
    },
  }),
  Rpc.make("jobads.typeahead", {
    success: TypeaheadResults,
    error: Schema.Unknown,
    payload: TypeaheadParams,
  }),
) {}
