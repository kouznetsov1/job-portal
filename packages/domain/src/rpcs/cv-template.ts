import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import {
  CVTemplate,
  CVTemplateId,
  TemplateRpcError,
} from "../schema/cv-template";

export class CVTemplatePublicRpcs extends RpcGroup.make(
  Rpc.make("cvTemplate.list", {
    success: Schema.Array(CVTemplate),
    error: TemplateRpcError,
  }),
  Rpc.make("cvTemplate.get", {
    payload: Schema.Struct({ templateId: CVTemplateId }),
    success: CVTemplate,
    error: TemplateRpcError,
  })
) {}

export class CVTemplateAuthRpcs extends RpcGroup.make(
  Rpc.make("cvTemplate.setActive", {
    payload: Schema.Struct({ templateId: CVTemplateId }),
    success: Schema.Boolean,
    error: TemplateRpcError,
  })
) {}

export const CVTemplateRpcs = CVTemplatePublicRpcs.merge(CVTemplateAuthRpcs);
