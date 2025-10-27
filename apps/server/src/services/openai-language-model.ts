import { OpenAiClient, OpenAiLanguageModel } from "@effect/ai-openai";
import { FetchHttpClient } from "@effect/platform";
import { Config, Effect, Layer } from "effect";

export const OpenAiLanguageModelLayer = Layer.unwrapEffect(
  Effect.gen(function* () {
    const apiKey = yield* Config.string("OPENAI_API_KEY");

    return Layer.provideMerge(
      OpenAiLanguageModel.layer({
        model: "gpt-4o-mini",
      }),
      OpenAiClient.layer({ apiKey }),
    ).pipe(Layer.provide(FetchHttpClient.layer));
  }),
);
