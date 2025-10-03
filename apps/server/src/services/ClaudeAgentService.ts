import { Effect, Stream, Data, Layer, Config } from "effect";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { BunContext } from "@effect/platform-bun";
import { createCvMcpServer } from "./CvMcpTools.js";
import { TypstService } from "./TypstService.js";
import { FileStorageService } from "./FileStorageService.js";
import { Database } from "../../../../packages/db/src/client.js";

export class ClaudeAgentError extends Data.TaggedError("ClaudeAgentError")<{
  message: string;
  cause?: unknown;
}> {}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class ClaudeAgentService extends Effect.Service<ClaudeAgentService>()(
  "ClaudeAgentService",
  {
    effect: Effect.gen(function* () {
      // Claude will utilize Claude Code login in the terminal
      // const apiKey = yield* Config.string("ANTHROPIC_API_KEY");

      const cvMcpServer = createCvMcpServer();

      const systemPrompt = `You are a Swedish CV (curriculum vitae) building assistant. Your role is to help users create professional CVs in Swedish.

Guidelines:
- Ask clarifying questions to gather missing information
- Use Typst to format the CV professionally
- Follow Swedish CV conventions
- Be conversational and helpful
- When you have enough information, generate a Typst document and compile it

Available tools:
- compile_typst: Compile Typst source to PDF
- get_user_profile: Get user profile data
- update_cv: Update CV source in database`;

      const chatStream = (userId: string, cvId: string, userMessage: string) =>
        Effect.gen(function* () {
          const user = yield* Database;

          const messageStream = yield* Effect.tryPromise({
            try: async () => {
              const q = query({
                prompt: userMessage,
                options: {
                  systemPrompt,
                  model: "claude-sonnet-4-20250514",
                  mcpServers: {
                    "cv-builder": cvMcpServer,
                  },
                  allowedTools: [
                    "compile_typst",
                    "get_user_profile",
                    "update_cv",
                  ],
                },
              });

              return q;
            },
            catch: (error) =>
              new ClaudeAgentError({
                message: "Failed to create chat query",
                cause: error,
              }),
          });

          return Stream.fromAsyncIterable(
            messageStream,
            (error) =>
              new ClaudeAgentError({
                message: "Chat stream error",
                cause: error,
              }),
          );
        });

      return { chatStream };
    }),
    dependencies: [
      TypstService.Default,
      FileStorageService.Default,
      BunContext.layer,
    ],
  },
) {}
