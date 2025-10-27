import { BackingPersistence, PersistenceBackingError } from "@effect/experimental/Persistence";
import { Effect, Layer, Option, Duration } from "effect";
import { Database } from "@repo/db";

export const PrismaPersistenceLayer = Layer.effect(
  BackingPersistence,
  Effect.gen(function* () {
    const db = yield* Database;

    const handleError = (method: string) =>
      Effect.mapError((error: unknown) =>
        PersistenceBackingError.make(method, error),
      );

    return {
      make: (storeId: string) =>
        Effect.succeed({
          get: (chatId: string) =>
            db
              .use((prisma) =>
                prisma.chat.findUnique({
                  where: { id: chatId },
                  select: { promptHistory: true, expiresAt: true },
                }),
              )
              .pipe(
                Effect.map((chat) => {
                  if (!chat || (chat.expiresAt && chat.expiresAt < new Date())) {
                    return Option.none();
                  }
                  return Option.some(chat.promptHistory);
                }),
                handleError("get"),
              ),

          set: (chatId: string, value: unknown, ttl: Option.Option<Duration.Duration>) =>
            db
              .use((prisma) =>
                prisma.chat.upsert({
                  where: { id: chatId },
                  create: {
                    id: chatId,
                    userId: "user_placeholder", // TODO: Get from auth context
                    promptHistory: value,
                    expiresAt: Option.map(ttl, (d) =>
                      new Date(Date.now() + Duration.toMillis(d)),
                    ).pipe(Option.getOrUndefined),
                  },
                  update: {
                    promptHistory: value,
                    expiresAt: Option.map(ttl, (d) =>
                      new Date(Date.now() + Duration.toMillis(d)),
                    ).pipe(Option.getOrUndefined),
                  },
                }),
              )
              .pipe(Effect.asVoid, handleError("set")),

          remove: (chatId: string) =>
            db
              .use((prisma) => prisma.chat.delete({ where: { id: chatId } }))
              .pipe(Effect.asVoid, handleError("remove")),

          clear: db
            .use((prisma) => prisma.chat.deleteMany({}))
            .pipe(Effect.asVoid, handleError("clear")),
        }),
    };
  }),
).pipe(Layer.provide(Database.Live));
