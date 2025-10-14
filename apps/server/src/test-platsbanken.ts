import { Effect, Layer } from "effect";
import { PlatsbankenSyncService } from "./services/platsbanken-sync";
import { JobAdsService } from "./integrations/platsbanken";
import { writeFileSync } from "fs";

const program = Effect.gen(function* () {
  const jobAdsService = yield* JobAdsService;
  const syncService = yield* PlatsbankenSyncService;

  const rawResults = yield* jobAdsService.search({ q: "utvecklare", limit: 3 });
  const transformedJobs =
    yield* syncService.fetchAndTransformJobs("utvecklare");

  writeFileSync(
    "platsbanken-original.json",
    JSON.stringify(rawResults.hits, null, 2),
  );
  writeFileSync(
    "platsbanken-transformed.json",
    JSON.stringify(transformedJobs, null, 2),
  );

  console.log("\n✅ Sparat original till: platsbanken-original.json");
  console.log("✅ Sparat transformerad till: platsbanken-transformed.json");
});

const AppLayer = Layer.provideMerge(
  PlatsbankenSyncService.Default,
  JobAdsService.Default,
);

Effect.runPromise(program.pipe(Effect.provide(AppLayer)));
