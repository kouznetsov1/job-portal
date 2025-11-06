import { Effect, Schema } from "effect";
import { FileSystem, Path } from "@effect/platform";
import * as ChildProcess from "node:child_process";

export class TypstCompilationError extends Schema.TaggedError<TypstCompilationError>()(
  "TypstCompilationError",
  {
    message: Schema.String,
    stderr: Schema.optional(Schema.String),
  },
) {}

export class TypstFileError extends Schema.TaggedError<TypstFileError>()(
  "TypstFileError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

export class TypstService extends Effect.Service<TypstService>()(
  "TypstService",
  {
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;

      const compile = (typstSource: string, outputPath: string) =>
        Effect.gen(function* () {
          const tmpDir = yield* fs.makeTempDirectory().pipe(
            Effect.mapError(
              (error) =>
                new TypstFileError({
                  message: "Failed to create temporary directory",
                  cause: error,
                }),
            ),
          );

          const typFile = path.join(tmpDir, "cv.typ");
          const pdfFile = path.join(tmpDir, "cv.pdf");

          yield* fs.writeFileString(typFile, typstSource).pipe(
            Effect.mapError(
              (error) =>
                new TypstFileError({
                  message: "Failed to write Typst file",
                  cause: error,
                }),
            ),
          );

          yield* Effect.tryPromise({
            try: () =>
              new Promise<void>((resolve, reject) => {
                ChildProcess.exec(
                  `typst compile "${typFile}" "${pdfFile}"`,
                  (error, _stdout, stderr) => {
                    if (error) {
                      reject(
                        new TypstCompilationError({
                          message: `Typst compilation failed: ${error.message}`,
                          stderr,
                        }),
                      );
                    } else {
                      resolve();
                    }
                  },
                );
              }),
            catch: (error) => {
              if (error instanceof TypstCompilationError) {
                return error;
              }
              return new TypstCompilationError({
                message: "Unexpected compilation error",
                stderr: String(error),
              });
            },
          });

          const pdfContent = yield* fs.readFile(pdfFile).pipe(
            Effect.mapError(
              (error) =>
                new TypstFileError({
                  message: "Failed to read PDF file",
                  cause: error,
                }),
            ),
          );

          yield* fs
            .makeDirectory(path.dirname(outputPath), { recursive: true })
            .pipe(
              Effect.mapError(
                (error) =>
                  new TypstFileError({
                    message: "Failed to create output directory",
                    cause: error,
                  }),
              ),
            );

          yield* fs.writeFile(outputPath, pdfContent).pipe(
            Effect.mapError(
              (error) =>
                new TypstFileError({
                  message: "Failed to copy PDF file",
                  cause: error,
                }),
            ),
          );

          yield* fs.remove(tmpDir, { recursive: true }).pipe(Effect.ignore);

          return { pdfPath: outputPath };
        });

      return { compile };
    }),
  },
) {}
