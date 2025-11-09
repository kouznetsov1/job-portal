import { createMistral } from "@ai-sdk/mistral";
import { generateText } from "ai";
import { Config, Data, Effect } from "effect";

export class OCRError extends Data.TaggedError("OCRError")<{
  message: string;
  cause?: unknown;
}> {}

export class OCR extends Effect.Service<OCR>()("OCR", {
  effect: Effect.gen(function* () {
    const apiKey = yield* Config.string("MISTRAL_API_KEY");
    const mistral = createMistral({ apiKey });

    const parseDocument = (fileData: string, mimeType: string) =>
      Effect.fn("ocr.parseDocument")(function* () {
        const dataUrl = `data:${mimeType};base64,${fileData}`;

        const result = yield* Effect.tryPromise({
          try: () =>
            generateText({
              model: mistral("mistral-small-latest"),
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Extrahera all text från detta dokument. Returnera bara texten i markdown-format, ingen annan kommentar.",
                    },
                    {
                      type: "file",
                      data: dataUrl,
                      mediaType: mimeType,
                    },
                  ],
                },
              ],
              providerOptions: {
                mistral: {
                  documentPageLimit: 64,
                  documentImageLimit: 8,
                },
              },
            }),
          catch: (error) =>
            new OCRError({
              message:
                error instanceof Error ? error.message : String(error),
              cause: error,
            }),
        });

        return result.text;
      })();

    return {
      parseDocument,
    };
  }),
}) {}
