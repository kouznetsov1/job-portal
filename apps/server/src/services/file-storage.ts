import { Effect, Data, Config } from "effect";
import { FileSystem, Path } from "@effect/platform";

export class FileStorageError extends Data.TaggedError("FileStorageError")<{
  message: string;
  cause?: unknown;
}> {}

export class FileStorageService extends Effect.Service<FileStorageService>()(
  "FileStorageService",
  {
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const storageRoot = yield* Config.string("STORAGE_ROOT").pipe(
        Config.withDefault("./storage"),
      );

      const save = (relativePath: string, content: Buffer | string) =>
        Effect.gen(function* () {
          const fullPath = path.join(storageRoot, relativePath);
          const dir = path.dirname(fullPath);

          yield* fs.makeDirectory(dir, { recursive: true }).pipe(
            Effect.mapError(
              (error) =>
                new FileStorageError({
                  message: `Failed to create directory: ${dir}`,
                  cause: error,
                }),
            ),
          );

          const data =
            typeof content === "string"
              ? new TextEncoder().encode(content)
              : content;

          yield* fs.writeFile(fullPath, data).pipe(
            Effect.mapError(
              (error) =>
                new FileStorageError({
                  message: `Failed to save file: ${relativePath}`,
                  cause: error,
                }),
            ),
          );

          return { path: relativePath };
        });

      const get = (relativePath: string) =>
        Effect.gen(function* () {
          const fullPath = path.join(storageRoot, relativePath);

          const content = yield* fs.readFile(fullPath).pipe(
            Effect.mapError(
              (error) =>
                new FileStorageError({
                  message: `Failed to read file: ${relativePath}`,
                  cause: error,
                }),
            ),
          );

          return content;
        });

      const del = (relativePath: string) =>
        Effect.gen(function* () {
          const fullPath = path.join(storageRoot, relativePath);

          yield* fs.remove(fullPath).pipe(
            Effect.mapError(
              (error) =>
                new FileStorageError({
                  message: `Failed to delete file: ${relativePath}`,
                  cause: error,
                }),
            ),
          );

          return { deleted: true };
        });

      const exists = (relativePath: string) =>
        Effect.gen(function* () {
          const fullPath = path.join(storageRoot, relativePath);
          return yield* fs.exists(fullPath);
        });

      const getPublicUrl = (relativePath: string) =>
        Effect.succeed(`/storage/${relativePath}`);

      return { save, get, del, exists, getPublicUrl };
    }),
  },
) {}
