import { Effect, Console, Schema } from "effect";
import { JobAdsService } from "../integrations/platsbanken";
import { transformJobAd } from "./platsbanken-transform";

export class PlatsbankenSyncService extends Effect.Service<PlatsbankenSyncService>()(
  "PlatsbankentSyncService",
  {
    effect: Effect.gen(function* () {
      const jobAdsService = yield* JobAdsService;

      return {
        fetchAndTransformJobs: (query?: string) =>
          Effect.gen(function* () {
            yield* Console.log(
              `Hämtar jobb från Platsbanken${query ? ` för: ${query}` : ""}...`,
            );

            const results = yield* jobAdsService.search({
              q: query,
              limit: 10,
            });

            yield* Console.log(
              `Hittade ${results.total.value} jobb, transformerar ${results.hits.length}...`,
            );

            const transformed = yield* Effect.all(
              results.hits.map((job) => Schema.decode(transformJobAd)(job)),
            );

            return transformed;
          }),
      };
    }),
  },
) {}
