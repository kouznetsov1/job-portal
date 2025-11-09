import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";
import {
  ChatStreamChunk,
  CompleteOnboardingRequest,
  GetChatResult,
  OnboardingChat,
  OnboardingChatId,
  OnboardingRpcError,
  SendMessageRequest,
} from "../schema/onboarding";
import { UserProfile } from "../schema/profile";

export class OnboardingRpcs extends RpcGroup.make(
  Rpc.make("onboarding.start", {
    success: OnboardingChat,
    error: OnboardingRpcError,
  }),
  Rpc.make("onboarding.sendMessage", {
    payload: SendMessageRequest,
    success: ChatStreamChunk,
    error: OnboardingRpcError,
  }),
  Rpc.make("onboarding.complete", {
    payload: CompleteOnboardingRequest,
    success: UserProfile,
    error: OnboardingRpcError,
  }),
  Rpc.make("onboarding.getChat", {
    payload: Schema.Struct({ chatId: OnboardingChatId }),
    success: GetChatResult,
    error: OnboardingRpcError,
  })
) {}
