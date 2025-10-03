import { Rpc } from "@effect/rpc";
import { CvRpcs } from "@repo/domain";
import { Database } from "@repo/db";
import { Effect, Layer, Stream, DateTime } from "effect";
import { ClaudeAgentService } from "../services/ClaudeAgentService.js";

export const CvLiveHandler: Layer.Layer<
  | Rpc.Handler<"cv.get">
  | Rpc.Handler<"cv.chat">
  | Rpc.Handler<"cv.getChatHistory">
> = CvRpcs.toLayer(
  Effect.gen(function* () {
    const db = yield* Database;
    const agentService = yield* ClaudeAgentService;

    return {
      "cv.get": (input) =>
        Effect.gen(function* () {
          const cv = yield* db.use((_) =>
            _.cv.findFirst({ where: { userId: input.userId } }),
          );

          if (!cv) {
            const newCv = yield* db.use((_) =>
              _.cv.create({ data: { userId: input.userId } }),
            );

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
        Stream.unwrap(
          Effect.gen(function* () {
            yield* db.use((_) =>
              _.cvChatMessage.create({
                data: {
                  cvId: input.cvId,
                  role: "user",
                  content: input.message,
                },
              }),
            );

            const messageStream = yield* agentService
              .chatStream(input.userId, input.cvId, input.message)
              .pipe(Effect.mapError((error) => String(error)));

            let fullAssistantMessage = "";

            return Stream.mapEffect(messageStream, (message) =>
              Effect.gen(function* () {
                if (message.type === "assistant") {
                  for (const block of message.message.content) {
                    if (block.type === "text" && "text" in block) {
                      fullAssistantMessage += block.text;
                      return {
                        type: "text" as const,
                        content: block.text,
                        toolName: undefined,
                        toolInput: undefined,
                      };
                    }
                    if (block.type === "tool_use" && "name" in block) {
                      return {
                        type: "tool_use" as const,
                        content: `Using tool: ${block.name}`,
                        toolName: block.name,
                        toolInput: "input" in block ? block.input : undefined,
                      };
                    }
                  }
                }

                return {
                  type: "assistant_message" as const,
                  content: "",
                  toolName: undefined,
                  toolInput: undefined,
                };
              }),
            ).pipe(
              Stream.tap(() =>
                Effect.sync(() => {
                  console.log("Stream chunk sent");
                }),
              ),
              Stream.onDone(() =>
                Effect.gen(function* () {
                  if (fullAssistantMessage) {
                    yield* db
                      .use((_) =>
                        _.cvChatMessage.create({
                          data: {
                            cvId: input.cvId,
                            role: "assistant",
                            content: fullAssistantMessage,
                          },
                        }),
                      )
                      .pipe(Effect.ignore);
                  }
                }),
              ),
            );
          }),
        ).pipe(Stream.mapError((error) => String(error))),

      "cv.getChatHistory": (input) =>
        Effect.gen(function* () {
          const messages = yield* db.use((_) =>
            _.cvChatMessage.findMany({
              where: { cvId: input.cvId },
              orderBy: { createdAt: "asc" },
            }),
          );

          return messages.map((msg) => ({
            id: msg.id,
            cvId: msg.cvId,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            createdAt: DateTime.unsafeMake(msg.createdAt.toISOString()),
          }));
        }),
    };
  }),
).pipe(Layer.provide(ClaudeAgentService.Default), Layer.provide(Database.Live));
