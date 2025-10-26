import { Config, Effect, Stream, Chunk, Option } from "effect";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { AIChatError, type ChatRequest } from "@repo/domain";

export class AIService extends Effect.Service<AIService>()("AIService", {
  scoped: Effect.gen(function* () {
    const apiKey = yield* Config.string("OPENAI_API_KEY");
    const openai = createOpenAI({ apiKey });

    const streamChat = (request: ChatRequest): Stream.Stream<string, AIChatError> => {
      const result = streamText({
        model: openai("gpt-4o-mini"),
        messages: [{ role: "user", content: request.message }],
      });

      return Stream.fromAsyncIterable(
        result.textStream,
        (error) =>
          new AIChatError({
            message: `AI-tjänsten misslyckades: ${error}`,
          }),
      ).pipe(
        Stream.filter((chunk) => chunk.length > 0),
      );
    };

    return { streamChat };
  }),
}) {}
