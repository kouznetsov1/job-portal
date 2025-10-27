import { Chat } from "@effect/ai";
import { Effect, Layer, Stream, Option } from "effect";
import { ChatRpcs, AIChatError } from "@repo/domain";
import { PrismaPersistenceLayer } from "../services/prisma-persistence";
import { OpenAiLanguageModelLayer } from "../services/openai-language-model";

const generateChatId = () => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

export const ChatLiveHandler = ChatRpcs.toLayer(
  Effect.gen(function* () {
    const persistence = yield* Chat.Persistence;

    return {
      "chat.stream": (params) =>
        Effect.gen(function* () {
          const chatId = params.chatId ?? generateChatId();

          const chat = yield* persistence.getOrCreate(chatId, {
            timeToLive: "30 days",
          });

          return chat.streamText({ prompt: params.message }).pipe(
            Stream.mapEffect((part) => {
              if (part.type === "text-delta") {
                return Effect.succeed({ content: part.delta });
              }
              if (part.type === "text") {
                return Effect.succeed({ content: part.text });
              }
              return Effect.succeed({ content: "" });
            }),
            Stream.filter((chunk) => chunk.content.length > 0),
          );
        }).pipe(
          Effect.mapError(
            (error) =>
              new AIChatError({
                message: `AI-tjänsten misslyckades: ${error}`,
              }),
          ),
        ),
    };
  }),
).pipe(
  Layer.provide(Chat.layerPersisted({ storeId: "chats" })),
  Layer.provide(PrismaPersistenceLayer),
  Layer.provide(OpenAiLanguageModelLayer),
);
