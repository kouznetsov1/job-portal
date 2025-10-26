import { ConfigProvider, Effect, Layer, Stream } from "effect";
import { ChatRpcs } from "@repo/domain";
import { AIService } from "../services/ai-service";

export const ChatLiveHandler = ChatRpcs.toLayer(
  Effect.gen(function* () {
    const aiService = yield* AIService;

    return {
      "chat.stream": (params) => {
        console.log("RPC handler called with params:", params);
        try {
          const stream = aiService.streamChat(params);
          console.log("Stream created");
          return stream.pipe(
            Stream.tapError((error) => Effect.sync(() => console.error("Stream error:", error))),
            Stream.tap((chunk) => Effect.sync(() => console.log("Stream chunk:", chunk))),
          );
        } catch (error) {
          console.error("Error creating stream:", error);
          throw error;
        }
      },
    };
  }),
).pipe(
  Layer.provide(AIService.Default),
  Layer.provide(Layer.setConfigProvider(ConfigProvider.fromEnv())),
);
