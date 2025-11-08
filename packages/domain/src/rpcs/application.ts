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

export class ApplicationRpcs extends RpcGroup.make(
  Rpc.make("application.generate", {
    payload: GenerateApplicationRequest,
    success: GenerationProgress,
    error: ApplicationRpcError,
  }),
  Rpc.make("application.get", {
    payload: Schema.Struct({ applicationId: ApplicationId }),
    success: Application,
    error: ApplicationRpcError,
  }),
  Rpc.make("application.list", {
    success: Schema.Array(Application),
    error: ApplicationRpcError,
  }),
  Rpc.make("application.regenerate", {
    payload: RegenerateApplicationRequest,
    success: GenerationProgress,
    error: ApplicationRpcError,
  }),
  Rpc.make("application.download", {
    payload: DownloadApplicationRequest,
    success: DownloadApplicationResult,
    error: ApplicationRpcError,
  }),
  Rpc.make("application.markApplied", {
    payload: MarkAppliedRequest,
    success: Application,
    error: ApplicationRpcError,
  }),
) {}
