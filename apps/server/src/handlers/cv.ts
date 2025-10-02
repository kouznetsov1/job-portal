import { Rpc } from "@effect/rpc";
import { CvRpcs } from "@repo/domain";
import { Database } from "@repo/db";
import { Effect, Layer, Stream, DateTime } from "effect";
import { ClaudeAgentService } from "../services/ClaudeAgentService.js";

export const CvLiveHandler: Layer.Layer<
  Rpc.Handler<"cv.get"> | Rpc.Handler<"cv.chat">,
  never,
  Database | ClaudeAgentService
> = CvRpcs.toLayer(
  Effect.gen(function* () {
    const db = yield* Database;
    const agentService = yield* ClaudeAgentService;

    return {
      "cv.get": (input) =>
        Effect.gen(function* () {
          const cv = yield* Effect.tryPromise({
            try: () =>
              db.cv.findFirst({
                where: { userId: input.userId },
              }),
            catch: (error) => String(error),
          });

          if (!cv) {
            const newCv = yield* Effect.tryPromise({
              try: () =>
                db.cv.create({
                  data: {
                    userId: input.userId,
                  },
                }),
              catch: (error) => String(error),
            });

            return {
              id: newCv.id,
              userId: newCv.userId,
              pdfPath: newCv.pdfPath,
              createdAt: DateTime.unsafeMake(newCv.createdAt.toISOString()),
              updatedAt: DateTime.unsafeMake(newCv.updatedAt.toISOString()),
            };
          }

          return {
            id: cv.id,
            userId: cv.userId,
            pdfPath: cv.pdfPath,
            createdAt: DateTime.unsafeMake(cv.createdAt.toISOString()),
            updatedAt: DateTime.unsafeMake(cv.updatedAt.toISOString()),
          };
        }),

      "cv.chat": (input) =>
        Effect.gen(function* () {
          const messageStream = yield* agentService.chatStream(
            input.userId,
            input.cvId,
            input.message,
          );

          let finalResponse = "";

          yield* Stream.runForEach(messageStream, (message) =>
            Effect.sync(() => {
              if (message.type === "assistant") {
                const textContent = message.message.content
                  .filter((c: { type: string }) => c.type === "text")
                  .map((c: { text?: string }) => ("text" in c ? c.text : ""))
                  .join("");
                finalResponse += textContent;
              }
            }),
          );

          yield* Effect.tryPromise({
            try: () =>
              db.cvChatMessage.create({
                data: {
                  cvId: input.cvId,
                  role: "user",
                  content: input.message,
                },
              }),
            catch: (error) => String(error),
          });

          if (finalResponse) {
            yield* Effect.tryPromise({
              try: () =>
                db.cvChatMessage.create({
                  data: {
                    cvId: input.cvId,
                    role: "assistant",
                    content: finalResponse,
                  },
                }),
              catch: (error) => String(error),
            });
          }

          return finalResponse;
        }).pipe(Effect.mapError((error) => String(error))),
    };
  }),
);
