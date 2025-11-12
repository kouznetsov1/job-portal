import { Config, Data, Effect } from "effect";

export class AIGenerationError extends Data.TaggedError("AIGenerationError")<{
  message: string;
  cause?: unknown;
}> {}

export class AIGeneration extends Effect.Service<AIGeneration>()(
  "AIGeneration",
  {
    effect: Effect.gen(function* () {
      const apiKey = yield* Config.string("OPENAI_API_KEY");

      // Placeholder for future AI generation methods
      // Will be used for:
      // - Onboarding chat (Phase 4)
      // - CV editor chat (Phase 3.8)
      // - Application generation (Phase 5)

      return {};
    }),
  }
) {}
