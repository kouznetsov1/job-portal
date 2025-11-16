import { Database } from "@repo/db";
import {
  CVTemplate,
  CVTemplateId,
  TemplateNotFoundError,
} from "@repo/domain";
import { Effect } from "effect";

export class CVTemplateService extends Effect.Service<CVTemplateService>()(
  "CVTemplateService",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database;

      const list = Effect.fn("cvTemplateService.list")(function* () {
        const templates = yield* db.use((client) =>
          client.cVTemplate.findMany({
            orderBy: { createdAt: "desc" },
          })
        );

        return templates.map((t) =>
          CVTemplate.make({
            id: CVTemplateId.make(t.id),
            name: t.name,
            description: t.description ?? undefined,
            typstCode: t.typstCode,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          })
        );
      })();

      const get = (templateId: string) =>
        Effect.fn("cvTemplateService.get")(function* () {
          yield* Effect.annotateCurrentSpan({ templateId });

          const template = yield* db.use((client) =>
            client.cVTemplate.findUnique({
              where: { id: templateId },
            })
          );

          if (!template) {
            return yield* Effect.fail(
              new TemplateNotFoundError({ id: CVTemplateId.make(templateId) })
            );
          }

          return CVTemplate.make({
            id: CVTemplateId.make(template.id),
            name: template.name,
            description: template.description ?? undefined,
            typstCode: template.typstCode,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
          });
        })();

      const setActive = (userId: string, templateId: string) =>
        Effect.fn("cvTemplateService.setActive")(function* () {
          yield* Effect.annotateCurrentSpan({ userId, templateId });

          const template = yield* db.use((client) =>
            client.cVTemplate.findUnique({
              where: { id: templateId },
            })
          );

          if (!template) {
            return yield* Effect.fail(
              new TemplateNotFoundError({ id: CVTemplateId.make(templateId) })
            );
          }

          yield* db.use((client) =>
            client.userProfile.update({
              where: { userId },
              data: { activeTemplateId: templateId },
            })
          );

          return true;
        })();

      return {
        list,
        get,
        setActive,
      };
    }),
  }
) {}
