import { Schema } from "effect";
import { DatabaseError } from "./database";
import { UserId } from "./user";

export const CVEditorChatId = Schema.String.pipe(
  Schema.brand("CVEditorChatId")
);
export const CVChatMessageId = Schema.String.pipe(
  Schema.brand("CVChatMessageId")
);

export const MessageRole = Schema.Literal("USER", "ASSISTANT");

export class CVChatMessage extends Schema.Class<CVChatMessage>("CVChatMessage")(
  {
    id: CVChatMessageId,
    chatId: CVEditorChatId,
    role: MessageRole,
    content: Schema.String,
    createdAt: Schema.Date,
  }
) {}

export class CVEditorChat extends Schema.Class<CVEditorChat>("CVEditorChat")({
  id: CVEditorChatId,
  userId: UserId,
  typstCode: Schema.String,
  messages: Schema.Array(CVChatMessage),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}

export class SendCVChatMessageRequest extends Schema.Class<SendCVChatMessageRequest>(
  "SendCVChatMessageRequest"
)({
  chatId: CVEditorChatId,
  message: Schema.String,
}) {}

export class CVChatStreamChunk extends Schema.Class<CVChatStreamChunk>(
  "CVChatStreamChunk"
)({
  content: Schema.String,
  done: Schema.Boolean,
  updatedTypstCode: Schema.optional(Schema.String),
}) {}

export class CompiledCVResult extends Schema.Class<CompiledCVResult>(
  "CompiledCVResult"
)({
  pdfData: Schema.String,
  success: Schema.Boolean,
  errors: Schema.optional(Schema.String),
}) {}

export class CVEditorError extends Schema.TaggedError<CVEditorError>()(
  "CVEditorError",
  { message: Schema.String }
) {}

export class CVCompilationError extends Schema.TaggedError<CVCompilationError>()(
  "CVCompilationError",
  {
    message: Schema.String,
    errors: Schema.String,
  }
) {}

export const CVEditorRpcError = Schema.Union(
  CVEditorError,
  CVCompilationError,
  DatabaseError
);
