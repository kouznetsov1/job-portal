import { Console, DateTime, Effect } from "effect";
import { PlatsbankenService } from "./integrations/platsbanken";

const program = Effect.gen(function* () {
  yield* Console.log("Testing stream endpoint...");
  const service = yield* PlatsbankenService;

  const now = yield* DateTime.now;
  const yesterday = DateTime.subtract(now, { days: 1 });

  yield* Console.log(`Fetching jobs changed in last 24 hours...`);
  const recentJobs = yield* service.stream({
    date: yesterday,
    updatedBeforeDate: now,
  });

  const activeAds = recentJobs.filter((ad) => !ad.removed);
  const removedAds = recentJobs.filter((ad) => ad.removed);

  yield* Console.log(
    `\n✅ Total: ${recentJobs.length} (${activeAds.length} active, ${removedAds.length} removed)`,
  );
});

Effect.runPromise(
  program.pipe(
    Effect.provide(PlatsbankenService.Default),
    Effect.tapError((error) => Console.error("Error:", error)),
  ),
)
  .then(() => console.log("Done!"))
  .catch((error) => console.error("Failed:", error));
