import { Database } from "@repo/db";
import { CVEditorError } from "@repo/domain";
import { Effect, Stream } from "effect";
import type { CoreMessage } from "ai";
import {
  CV_EDITOR_SYSTEM_PROMPT,
  buildCVEditorUserPrompt,
} from "../prompts/cv-editor";
import { AI } from "./ai";
import { TypstService } from "./typst";

export class CVEditorService extends Effect.Service<CVEditorService>()(
  "CVEditorService",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database;
      const ai = yield* AI;
      const typst = yield* TypstService;

      const getOrCreateChat = (userId: string) =>
        Effect.fn("cvEditorService.getOrCreateChat")(function* () {
          let chat = yield* db.use((p) =>
            p.cVEditorChat.findFirst({
              where: { userId },
              include: { messages: true },
            }),
          );

          if (!chat) {
            const defaultTemplate = yield* db.use((p) =>
              p.cVTemplate.findFirst({
                orderBy: { createdAt: "asc" },
              }),
            );

            const defaultTypstCode =
              defaultTemplate?.typstCode ??
              `#set page(paper: "a4")
#set text(font: "New Computer Modern", size: 11pt)

= Curriculum Vitae

*Namn:* Din Namn

*E-post:* din.epost@exempel.se

*Telefon:* 070-123 45 67

== Arbetslivserfarenhet

_Din titel_ | _Företag_ | _2020 - Nu_

Beskriv dina arbetsuppgifter här.

== Utbildning

_Din examen_ | _Högskola_ | _2016 - 2020_

== Kompetenser

- Kompetens 1
- Kompetens 2
- Kompetens 3
`;

            chat = yield* db.use((p) =>
              p.cVEditorChat.create({
                data: {
                  userId,
                  typstCode: defaultTypstCode,
                },
                include: { messages: true },
              }),
            );
          }

          return {
            chat: {
              id: chat.id,
              userId: chat.userId,
              typstCode: chat.typstCode,
              messages: chat.messages.map((m) => ({
                id: m.id,
                chatId: m.chatId,
                role: m.role,
                content: m.content,
                createdAt: m.createdAt,
              })),
              createdAt: chat.createdAt,
              updatedAt: chat.updatedAt,
            },
            messages: chat.messages.map((m) => ({
              id: m.id,
              chatId: m.chatId,
              role: m.role,
              content: m.content,
              createdAt: m.createdAt,
            })),
          };
        })();

      const sendMessage = (params: { chatId: string; message: string }) =>
        Effect.fn("cvEditorService.sendMessage")(function* () {
          const { chatId, message } = params;

          const chat = yield* db.use((p) =>
            p.cVEditorChat.findUnique({
              where: { id: chatId },
              include: { messages: true, user: { include: { profile: true } } },
            }),
          );

          if (!chat) {
            return yield* Effect.fail(
              new CVEditorError({ message: "Chatt hittades inte" }),
            );
          }

          yield* db.use((p) =>
            p.cVChatMessage.create({
              data: {
                chatId,
                role: "USER",
                content: message,
              },
            }),
          );

          const profileData = chat.user.profile
            ? {
                fullName: chat.user.profile.fullName ?? undefined,
                email: chat.user.profile.email ?? undefined,
                phone: chat.user.profile.phone ?? undefined,
                headline: chat.user.profile.headline ?? undefined,
                summary: chat.user.profile.summary ?? undefined,
                skills: chat.user.profile.skills,
              }
            : undefined;

          const userPrompt = buildCVEditorUserPrompt({
            currentTypstCode: chat.typstCode,
            userMessage: message,
            profileData,
          });

          const chatHistory: CoreMessage[] = [
            ...chat.messages.map((m) => ({
              role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
              content: m.content,
            })),
            {
              role: "user" as const,
              content: userPrompt,
            },
          ];

          const textStream = yield* ai.stream({
            system: CV_EDITOR_SYSTEM_PROMPT,
            messages: chatHistory,
          });

          let fullText = "";

          return textStream.pipe(
            Stream.tap((chunk) =>
              Effect.sync(() => {
                fullText += chunk;
              }),
            ),
            Stream.map((chunk) => ({
              content: chunk,
              done: false as const,
              updatedTypstCode: undefined,
            })),
            Stream.concat(
              Stream.fromEffect(
                Effect.gen(function* () {
                  yield* db.use((p) =>
                    p.cVChatMessage.create({
                      data: {
                        chatId,
                        role: "ASSISTANT",
                        content: fullText,
                      },
                    }),
                  );

                  const typstMatch = fullText.match(/```typst\n([\s\S]*?)\n```/);
                  let extractedTypstCode: string | undefined;

                  if (typstMatch) {
                    extractedTypstCode = typstMatch[1];
                    yield* db.use((p) =>
                      p.cVEditorChat.update({
                        where: { id: chatId },
                        data: { typstCode: extractedTypstCode },
                      }),
                    );
                  }

                  return {
                    content: "",
                    done: true as const,
                    updatedTypstCode: extractedTypstCode,
                  };
                }),
              ),
            ),
            Stream.mapError((error) => {
              if (error._tag === "AIError" || error._tag === "DatabaseError") {
                return new CVEditorError({ message: error.message });
              }
              return error;
            }),
          );
        })();

      const updateTypstCode = (params: { chatId: string; typstCode: string }) =>
        Effect.fn("cvEditorService.updateTypstCode")(function* () {
          const { chatId, typstCode } = params;

          yield* db.use((p) =>
            p.cVEditorChat.update({
              where: { id: chatId },
              data: { typstCode },
            }),
          );

          return yield* typst.compile(typstCode).pipe(
            Effect.mapError((error) => {
              if (error._tag === "CVCompilationError") {
                return error;
              }
              return new CVEditorError({
                message: "message" in error ? error.message : String(error),
              });
            }),
          );
        })();

      return {
        getOrCreateChat,
        sendMessage,
        updateTypstCode,
      };
    }),
    dependencies: [Database.Default, AI.Default, TypstService.Default],
  },
) {}
