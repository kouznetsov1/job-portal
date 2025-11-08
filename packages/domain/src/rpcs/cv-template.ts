import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import { CVTemplate, CVTemplateId, TemplateRpcError } from "../schema/cv-template";

export class CVTemplatesRpcs extends RpcGroup.make(
  Rpc.make("cvTemplates.list", {
    success: Schema.Array(CVTemplate),
    error: TemplateRpcError,
  }),
  Rpc.make("cvTemplates.get", {
    payload: Schema.Struct({ templateId: CVTemplateId }),
    success: CVTemplate,
    error: TemplateRpcError,
  }),
  Rpc.make("cvTemplates.setActive", {
    payload: Schema.Struct({ templateId: CVTemplateId }),
    success: Schema.Boolean,
    error: TemplateRpcError,
  }),
) {}
