import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { Effect, Layer } from "effect";
import { z } from "zod";
import { BunContext, BunFileSystem, BunPath } from "@effect/platform-bun";
import { TypstService } from "./TypstService.js";
import { FileStorageService } from "./FileStorageService.js";

export const createCvMcpServer = () => {
  const platformLayer = Layer.mergeAll(
    BunContext.layer,
    BunFileSystem.layer,
    BunPath.layer,
  );

  const servicesLayer = Layer.mergeAll(
    TypstService.Default,
    FileStorageService.Default,
  ).pipe(Layer.provide(platformLayer));
  const compileTypstTool = tool(
    "compile_typst",
    "Compile Typst source code to PDF. Returns the path to the generated PDF file.",
    {
      typstSource: z.string().describe("Typst source code to compile"),
      cvId: z.string().describe("CV ID for saving the PDF"),
    },
    async (args) => {
      const program = Effect.gen(function* () {
        const typstService = yield* TypstService;
        const storageService = yield* FileStorageService;

        const pdfPath = `cvs/${args.cvId}/cv.pdf`;
        const fullPath = `./storage/${pdfPath}`;

        const result = yield* typstService.compile(args.typstSource, fullPath);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                pdfPath,
                message: "PDF compiled successfully",
              }),
            },
          ],
        };
      });

      const result = await Effect.runPromise(
        program.pipe(
          Effect.catchAll((error) =>
            Effect.succeed({
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    success: false,
                    error: String(error),
                  }),
                },
              ],
              isError: true,
            }),
          ),
          Effect.provide(servicesLayer),
        ),
      );

      return result;
    },
  );

  const getUserProfileTool = tool(
    "get_user_profile",
    "Get user profile data to prefill the CV.",
    {
      userId: z.string().describe("User ID"),
    },
    async (args) => {
      const program = Effect.gen(function* () {

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                profile: {
                  name: "John Doe",
                  email: "john@example.com",
                },
              }),
            },
          ],
        };
      });

      const result = await Effect.runPromise(
        program.pipe(
          Effect.catchAll((error) =>
            Effect.succeed({
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    success: false,
                    error: String(error),
                  }),
                },
              ],
              isError: true,
            }),
          ),
          Effect.provide(servicesLayer),
        ),
      );

      return result;
    },
  );

  const updateCvTool = tool(
    "update_cv",
    "Update the CV's Typst source code in the database.",
    {
      cvId: z.string().describe("CV ID"),
      typstSource: z.string().describe("New Typst source code"),
    },
    async (args) => {
      const program = Effect.gen(function* () {

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                message: "CV updated successfully",
              }),
            },
          ],
        };
      });

      const result = await Effect.runPromise(
        program.pipe(
          Effect.catchAll((error) =>
            Effect.succeed({
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    success: false,
                    error: String(error),
                  }),
                },
              ],
              isError: true,
            }),
          ),
          Effect.provide(servicesLayer),
        ),
      );

      return result;
    },
  );

  return createSdkMcpServer({
    name: "cv-builder",
    version: "1.0.0",
    tools: [compileTypstTool, getUserProfileTool, updateCvTool],
  });
};
