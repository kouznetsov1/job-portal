import { Schema } from "effect";
import { DatabaseError } from "./database";
import { UserId } from "./user";

export const OnboardingChatId = Schema.String.pipe(
  Schema.brand("OnboardingChatId")
);
export const ChatMessageId = Schema.String.pipe(Schema.brand("ChatMessageId"));

export const OnboardingStatus = Schema.Literal(
  "ACTIVE",
  "COMPLETED",
  "ABANDONED"
);

export const ChatMessageRole = Schema.Literal("USER", "ASSISTANT");

export class ChatMessage extends Schema.Class<ChatMessage>("ChatMessage")({
  id: ChatMessageId,
  chatId: OnboardingChatId,
  role: ChatMessageRole,
  content: Schema.String,
  createdAt: Schema.Date,
}) {}

export class OnboardingChat extends Schema.Class<OnboardingChat>(
  "OnboardingChat"
)({
  id: OnboardingChatId,
  userId: UserId,
  status: OnboardingStatus,
  createdAt: Schema.Date,
  completedAt: Schema.optional(Schema.Date),
}) {}

export class SendMessageRequest extends Schema.Class<SendMessageRequest>(
  "SendMessageRequest"
)({
  chatId: OnboardingChatId,
  message: Schema.String,
}) {}

export class ChatStreamChunk extends Schema.Class<ChatStreamChunk>(
  "ChatStreamChunk"
)({
  content: Schema.String,
  done: Schema.Boolean,
}) {}

export class CompleteOnboardingRequest extends Schema.Class<CompleteOnboardingRequest>(
  "CompleteOnboardingRequest"
)({
  chatId: OnboardingChatId,
}) {}

export class GetChatResult extends Schema.Class<GetChatResult>("GetChatResult")(
  {
    chat: OnboardingChat,
    messages: Schema.Array(ChatMessage),
  }
) {}

export class OnboardingChatNotFoundError extends Schema.TaggedError<OnboardingChatNotFoundError>()(
  "OnboardingChatNotFoundError",
  { chatId: OnboardingChatId }
) {}

export class OnboardingError extends Schema.TaggedError<OnboardingError>()(
  "OnboardingError",
  { message: Schema.String }
) {}

export const OnboardingRpcError = Schema.Union(
  OnboardingChatNotFoundError,
  OnboardingError,
  DatabaseError
);
