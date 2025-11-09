import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
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
      const openai = createOpenAI({ apiKey });

      const generateCompanyDescription = (
        companyName: string,
        scrapedContent?: string
      ) =>
        Effect.fn("aiGeneration.generateCompanyDescription")(function* () {
          const contextText = scrapedContent
            ? `Företagsnamn: ${companyName}\n\nWebbplatsinnehåll:\n${scrapedContent.slice(0, 8000)}`
            : `Företagsnamn: ${companyName}`;

          const result = yield* Effect.tryPromise({
            try: () =>
              generateText({
                model: openai("gpt-4o-mini"),
                messages: [
                  {
                    role: "user",
                    content: `Baserat på följande information om ett företag, skapa en kort beskrivning (3-5 meningar) på svenska som sammanfattar vad företaget gör, deras uppdrag och kultur. Fokusera på det mest relevanta för jobbsökande.

${contextText}

Svara endast med beskrivningen, ingen extra text.`,
                  },
                ],
              }),
            catch: (error) =>
              new AIGenerationError({
                message: "Failed to generate company description",
                cause: error,
              }),
          });

          return result.text;
        })();

      const generateJobSummary = (
        jobTitle: string,
        jobDescription: string,
        companyDescription?: string
      ) =>
        Effect.fn("aiGeneration.generateJobSummary")(function* () {
            const contextParts = [
              `Jobbtitel: ${jobTitle}`,
              `\nJobbbeskrivning:\n${jobDescription.slice(0, 5000)}`,
            ];

            if (companyDescription) {
              contextParts.push(`\nFöretagsbeskrivning:\n${companyDescription}`);
            }

            const contextText = contextParts.join("\n");

            const result = yield* Effect.tryPromise({
              try: () =>
                generateText({
                  model: openai("gpt-4o-mini"),
                  messages: [
                    {
                      role: "user",
                      content: `Baserat på följande jobbannons, skapa en sammanfattning på 10 meningar på svenska som beskriver jobbet, kraven, ansvarsområden och vad som gör det intressant. Fokusera på information som är viktig för matchning med kandidater.

${contextText}

Skriv sammanfattningen som löpande text i 10 meningar.`,
                    },
                  ],
                }),
              catch: (error) =>
                new AIGenerationError({
                  message: "Failed to generate job summary",
                  cause: error,
                }),
            });

            return result.text;
          }
        )();

      return {
        generateCompanyDescription,
        generateJobSummary,
      };
    }),
  }
) {}
