import { expect, it } from "@effect/vitest";
import { BunContext } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { TypstService } from "./typst";

const TestLayer = Layer.mergeAll(BunContext.layer, TypstService.Default);

it.scopedLive("ska kompilera en enkel Typst-dokument till PDF", () =>
  Effect.gen(function* () {
    const simpleTypst = `
#set document(title: "Test CV")
#set page(paper: "a4")

= Test CV

== Personlig Information
- Namn: Test Person
- E-post: test\\@example.com

== Erfarenhet
*Utvecklare* \\\\ 2020-2024

Arbetsuppgifter:
- Utveckling av webbapplikationer
- Backend-tjänster med TypeScript

== Utbildning
*Civilingenjör, Datateknik* \\\\ 2016-2020
`;

    const typst = yield* TypstService;
    const result = yield* typst.compile(simpleTypst);

    expect(result.success).toBe(true);
    expect(result.pdfData).toBeTruthy();
    expect(result.pdfData.length).toBeGreaterThan(0);

    const pdfBuffer = Buffer.from(result.pdfData, "base64");
    expect(pdfBuffer.toString("ascii", 0, 4)).toBe("%PDF");
  }).pipe(Effect.provide(TestLayer))
);

it.scopedLive("ska misslyckas vid ogiltig Typst-kod", () =>
  Effect.gen(function* () {
    const invalidTypst = `
#this-is-not-valid-typst!!!
totally broken syntax here
`;

    const typst = yield* TypstService;
    const result = yield* Effect.exit(typst.compile(invalidTypst));

    expect(result._tag).toBe("Failure");
  }).pipe(Effect.provide(TestLayer))
);
