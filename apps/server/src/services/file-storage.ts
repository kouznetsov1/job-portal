import { FileSystem, Path } from "@effect/platform";
import { Effect } from "effect";
import { randomUUID } from "node:crypto";

export class FileStorage extends Effect.Service<FileStorage>()(
  "FileStorage",
  {
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;

      const storageDir = path.join("uploads", "cvs");

      const save = (fileName: string, fileData: string, mimeType: string) =>
        Effect.fn("fileStorage.save")(function* () {
          yield* fs.makeDirectory(storageDir, { recursive: true });

          const buffer = Buffer.from(fileData, "base64");
          const ext = mimeType.includes("pdf") ? "pdf" : "docx";
          const uniqueFileName = `${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}.${ext}`;
          const filePath = path.join(storageDir, uniqueFileName);

          yield* fs.writeFile(filePath, buffer);

          return `/uploads/cvs/${uniqueFileName}`;
        })();

      const read = (filePath: string) =>
        Effect.fn("fileStorage.read")(function* () {
          const buffer = yield* fs.readFile(filePath);
          return buffer;
        })();

      return {
        save,
        read,
      };
    }),
  }
) {}
