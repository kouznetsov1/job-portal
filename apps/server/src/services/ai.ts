import { createOpenAI } from "@ai-sdk/openai";
import {
  type CoreMessage,
  type CoreTool,
  embed,
  type ModelMessage,
  streamText,
} from "ai";
import { Config, Data, Effect, Stream } from "effect";

export class AIError extends Data.TaggedError("AIError")<{
  message: string;
  cause?: unknown;
}> {}

export class EmbeddingError extends Data.TaggedError("EmbeddingError")<{
  message: string;
  cause?: unknown;
}> {}

export class AI extends Effect.Service<AI>()("AI", {
  effect: Effect.gen(function* () {
    const apiKey = yield* Config.string("OPENAI_API_KEY");
    const openai = createOpenAI({ apiKey });

    const createEmbedding = (text: string) =>
      Effect.fn("ai.embedding.generate")(function* () {
        const result = yield* Effect.tryPromise({
          try: () =>
            embed({
              model: openai.textEmbedding("text-embedding-3-small"),
              value: text,
            }),
          catch: (error) =>
            new EmbeddingError({
              message: error instanceof Error ? error.message : String(error),
              cause: error,
            }),
        });

        return result.embedding;
      })();

    const stream = (params: {
      system: string;
      messages: ModelMessage[];
      model?: string;
      tools?: Record<string, CoreTool>;
    }) =>
      Effect.fn("ai.chat.stream")(function* () {
        const modelName = params.model ?? "gpt-4o-mini";

        const result = yield* Effect.sync(() =>
          streamText({
            model: openai(modelName),
            system: params.system,
            messages: params.messages,
            tools: params.tools,
            onError({ error }) {
              Effect.logError("AI stream error").pipe(
                Effect.annotateLogs({ error: String(error) }),
                Effect.runSync,
              );
            },
          }),
        );

        return Stream.fromAsyncIterable(
          result.textStream,
          (error) =>
            new AIError({
              message: error instanceof Error ? error.message : String(error),
              cause: error,
            }),
        );
      })();

    const generate = (params: {
      system: string;
      messages: CoreMessage[];
      model?: string;
      tools?: Record<string, CoreTool>;
    }) =>
      Effect.fn("ai.chat.generate")(function* () {
        const textStream = yield* stream(params);

        return yield* Stream.runFold(
          textStream,
          "",
          (acc, chunk) => acc + chunk,
        );
      })();

    return {
      createEmbedding,
      generate,
      stream,
    };
  }),
}) {}
