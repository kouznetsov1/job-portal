import { Console, Effect, Schema } from "effect";
import { readFile } from "node:fs/promises";
import { JobStreamResponse } from "@repo/domain";
import { Database } from "@repo/db";
import { PlatsbankenJobTransform } from "./services/platsbanken-job-transform";
import { PlatsbankenDbImportService } from "./services/platsbanken-db-import";

const program = Effect.gen(function* () {
  const snapshotPath = process.argv[2] || "platsbanken-snapshot-2025-10-14.json";
  const batchSize = process.argv[3] ? Number.parseInt(process.argv[3], 10) : undefined;

  yield* Console.log(`📂 Läser snapshot från: ${snapshotPath}`);

  const fileContent = yield* Effect.tryPromise({
    try: () => readFile(snapshotPath, "utf-8"),
    catch: (error) => new Error(`Kunde inte läsa fil: ${error}`),
  });

  yield* Console.log("🔍 Parsar JSON...");

  const rawData = yield* Effect.try({
    try: () => JSON.parse(fileContent),
    catch: (error) => new Error(`Ogiltigt JSON: ${error}`),
  });

  yield* Console.log("✅ Validerar data mot Platsbanken-schema...");

  const jobAds = yield* Schema.decodeUnknown(JobStreamResponse)(rawData);

  yield* Console.log(`✅ ${jobAds.length} jobbano nser validerade`);

  const jobsToProcess = batchSize ? jobAds.slice(0, batchSize) : jobAds;

  if (batchSize) {
    yield* Console.log(`🔧 Testar med första ${batchSize} jobb`);
  }

  yield* Console.log("🔄 Transformerar jobb...");

  const transformResults = yield* Effect.all(
    jobsToProcess.map((jobAd) =>
      Effect.either(Schema.decodeUnknown(PlatsbankenJobTransform)(jobAd)),
    ),
    { concurrency: "unbounded" },
  );

  const transformedJobs = transformResults.filter(
    (result) => result._tag === "Right",
  ).map((result) => result.right);

  const failedTransforms = transformResults.filter(
    (result) => result._tag === "Left",
  );

  yield* Console.log(
    `✅ ${transformedJobs.length} jobb transformerade, ${failedTransforms.length} misslyckades`,
  );

  const importService = yield* PlatsbankenDbImportService;

  const result = yield* importService.importJobs(transformedJobs);

  yield* Console.log(`
📊 Importsammanfattning:
   ✅ Lyckade: ${result.successCount}
   ❌ Misslyckade: ${result.errorCount}
   📈 Totalt: ${jobsToProcess.length}
  `);
});

Effect.runPromise(
  program.pipe(
    Effect.provide(PlatsbankenDbImportService.Default),
    Effect.provide(Database.Live),
    Effect.tapError((error) =>
      Console.error(`❌ Fel vid import: ${error}`),
    ),
  ),
)
  .then(() => {
    console.log("✅ Import klar!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Import misslyckades:", error);
    process.exit(1);
  });
