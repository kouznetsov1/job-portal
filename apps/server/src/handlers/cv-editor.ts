import { CVEditorRpcs, CurrentSession } from "@repo/domain";
import { Rpc } from "@effect/rpc";
import { Effect, Layer } from "effect";
import { CVEditorService } from "../services/cv-editor-service";

export const CVEditor = CVEditorRpcs.toLayer({
  "cvEditor.getOrCreateChat": () =>
    Effect.gen(function* () {
      const cvEditor = yield* CVEditorService;
      const session = yield* CurrentSession;

      return yield* cvEditor.getOrCreateChat(session.userId);
    }),

  "cvEditor.sendMessage": ({ chatId, message }) =>
    Rpc.fork(
      Effect.gen(function* () {
        const cvEditor = yield* CVEditorService;
        yield* CurrentSession;

        return yield* cvEditor.sendMessage({ chatId, message });
      }),
    ),

  "cvEditor.updateTypstCode": ({ typstCode }) =>
    Effect.gen(function* () {
      const cvEditor = yield* CVEditorService;
      const session = yield* CurrentSession;

      const chat = yield* cvEditor.getOrCreateChat(session.userId);

      return yield* cvEditor.updateTypstCode({
        chatId: chat.chat.id,
        typstCode,
      });
    }),
}).pipe(Layer.provide(CVEditorService.Default));
