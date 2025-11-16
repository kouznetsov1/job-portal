import { Command, FileSystem, Path } from "@effect/platform";
import { BunContext } from "@effect/platform-bun";
import { CVCompilationError } from "@repo/domain";
import { Effect } from "effect";

export class TypstService extends Effect.Service<TypstService>()(
  "TypstService",
  {
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;

      const compile = (typstCode: string) =>
        Effect.fn("typstService.compile")(function* () {
          const cwd = process.cwd();
          const tmpDirName = `typst-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const tmpDir = path.join(cwd, ".tmp", tmpDirName);
          yield* fs.makeDirectory(tmpDir, { recursive: true });

          const inputPath = path.join(tmpDir, "input.typ");
          const outputPath = path.join(tmpDir, "output.pdf");

          yield* fs.writeFileString(inputPath, typstCode);

          const command = Command.make(
            "typst",
            "compile",
            inputPath,
            outputPath,
          );

          yield* Command.exitCode(command).pipe(
            Effect.tapError((error) =>
              Effect.logError("Typst command failed", error),
            ),
            Effect.mapError(
              (error) =>
                new CVCompilationError({
                  message: "Typst kompilering misslyckades",
                  errors: error.message,
                }),
            ),
          );

          const pdfBuffer = yield* fs.readFile(outputPath).pipe(
            Effect.mapError(
              (error) =>
                new CVCompilationError({
                  message: "Kunde inte läsa PDF-fil",
                  errors: `File not created: ${error.message}`,
                }),
            ),
          );
          const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

          yield* fs.remove(tmpDir, { recursive: true });

          return {
            pdfData: pdfBase64,
            success: true,
          };
        })();

      return {
        compile,
      };
    }),
    dependencies: [BunContext.layer],
  },
) {}
