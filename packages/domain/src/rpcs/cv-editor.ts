import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import {
  CompiledCVResult,
  CVChatMessage,
  CVChatStreamChunk,
  CVEditorChat,
  CVEditorRpcError,
  SendCVChatMessageRequest,
} from "../schema/cv-editor";

export class GetOrCreateChatResult extends Schema.Class<GetOrCreateChatResult>(
  "GetOrCreateChatResult",
)({
  chat: CVEditorChat,
  messages: Schema.Array(CVChatMessage),
}) {}

export class CVEditorRpcs extends RpcGroup.make(
  Rpc.make("cvEditor.getOrCreateChat", {
    success: GetOrCreateChatResult,
    error: CVEditorRpcError,
  }),
  Rpc.make("cvEditor.sendMessage", {
    payload: SendCVChatMessageRequest,
    success: CVChatStreamChunk,
    error: CVEditorRpcError,
  }),
  Rpc.make("cvEditor.updateTypstCode", {
    payload: Schema.Struct({ typstCode: Schema.String }),
    success: CompiledCVResult,
    error: CVEditorRpcError,
  }),
) {}
