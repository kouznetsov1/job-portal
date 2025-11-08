import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import {
  Application,
  ApplicationId,
  ApplicationRpcError,
  DownloadApplicationRequest,
  DownloadApplicationResult,
  GenerateApplicationRequest,
  GenerationProgress,
  MarkAppliedRequest,
  RegenerateApplicationRequest,
} from "../schema/application";

export class ApplicationsRpcs extends RpcGroup.make(
  Rpc.make("applications.generate", {
    payload: GenerateApplicationRequest,
    success: GenerationProgress,
    error: ApplicationRpcError,
  }),
  Rpc.make("applications.get", {
    payload: Schema.Struct({ applicationId: ApplicationId }),
    success: Application,
    error: ApplicationRpcError,
  }),
  Rpc.make("applications.list", {
    success: Schema.Array(Application),
    error: ApplicationRpcError,
  }),
  Rpc.make("applications.regenerate", {
    payload: RegenerateApplicationRequest,
    success: GenerationProgress,
    error: ApplicationRpcError,
  }),
  Rpc.make("applications.download", {
    payload: DownloadApplicationRequest,
    success: DownloadApplicationResult,
    error: ApplicationRpcError,
  }),
  Rpc.make("applications.markApplied", {
    payload: MarkAppliedRequest,
    success: Application,
    error: ApplicationRpcError,
  }),
) {}
