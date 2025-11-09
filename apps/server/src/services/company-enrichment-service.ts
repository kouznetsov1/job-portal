import { Database } from "@repo/db";
import { Data, Effect, Option } from "effect";
import { AIGeneration } from "./ai-generation";
import { WebCrawler } from "./web-crawler";

export class CompanyEnrichmentError extends Data.TaggedError(
  "CompanyEnrichmentError"
)<{
  message: string;
  cause?: unknown;
}> {}

export class CompanyEnrichmentService extends Effect.Service<CompanyEnrichmentService>()(
  "CompanyEnrichmentService",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database;
      const webCrawler = yield* WebCrawler;
      const aiGeneration = yield* AIGeneration;

      const enrichCompany = (companyId: string) =>
        Effect.fn("companyEnrichment.enrichCompany")(function* () {
            const company = yield* db
              .use((p) =>
                p.company.findUnique({
                  where: { id: companyId },
                })
              )
              .pipe(
                Effect.flatMap(
                  Option.liftThrowable((c) => {
                    if (!c)
                      throw new CompanyEnrichmentError({
                        message: `Företag hittades inte: ${companyId}`,
                      });
                    return c;
                  })
                )
              );

            const scrapedDataOption = company.website
              ? yield* webCrawler.scrapeWebsite(company.website).pipe(
                  Effect.option,
                  Effect.tapError((error) =>
                    Effect.logError("Misslyckades med att skrapa webbplats", {
                      error,
                    })
                  )
                )
              : Option.none();

            const scrapedContent = Option.match(scrapedDataOption, {
              onNone: () => {},
              onSome: (data) => data.markdown || data.html,
            });

            const aiDescription = yield* aiGeneration.generateCompanyDescription(
              company.name,
              scrapedContent
            );

            const socialMedia = Option.match(scrapedDataOption, {
              onNone: () => {},
              onSome: (data) => (data.socialLinks ? data.socialLinks : undefined),
            });

            const scrapedData = Option.match(scrapedDataOption, {
              onNone: () => {},
              onSome: (data) => ({
                markdown: data.markdown,
                metadata: data.metadata,
                scrapedAt: new Date().toISOString(),
              }),
            });

            const enriched = yield* db.use((p) =>
              p.company.update({
                where: { id: companyId },
                data: {
                  aiDescription,
                  socialMedia,
                  scrapedData,
                  lastEnriched: new Date(),
                },
              })
            );

            return enriched;
          }
        )();

      return {
        enrichCompany,
      };
    }),
  }
) {}
