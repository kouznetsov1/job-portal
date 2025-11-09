import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import { Config, Data, Effect } from "effect";

export class EmbeddingError extends Data.TaggedError("EmbeddingError")<{
  message: string;
  cause?: unknown;
}> {}

export class Embedding extends Effect.Service<Embedding>()("Embedding", {
  effect: Effect.gen(function* () {
    const apiKey = yield* Config.string("OPENAI_API_KEY");
    const openai = createOpenAI({ apiKey });

    const generate = (text: string) =>
      Effect.fn("embedding.generate")(function* () {
        const result = yield* Effect.tryPromise({
          try: () =>
            embed({
              model: openai.textEmbedding("text-embedding-3-small"),
              value: text,
            }),
          catch: (error) =>
            new EmbeddingError({
              message:
                error instanceof Error ? error.message : String(error),
              cause: error,
            }),
        });

        return result.embedding;
      })();

    return {
      generate,
    };
  }),
}) {}
