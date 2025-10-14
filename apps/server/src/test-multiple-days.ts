import { Console, DateTime, Effect } from "effect";
import { PlatsbankenService } from "./integrations/platsbanken";

const program = Effect.gen(function* () {
  yield* Console.log("Testing stream endpoint for multiple days...\n");
  const service = yield* PlatsbankenService;

  const now = yield* DateTime.now;
  const daysToTest = 7;

  for (let i = 0; i < daysToTest; i++) {
    const endDate = DateTime.subtract(now, { days: i });
    const startDate = DateTime.subtract(endDate, { days: 1 });

    yield* Console.log(
      `\n📅 Day ${i + 1}: ${DateTime.formatIso(startDate).split("T")[0]} to ${DateTime.formatIso(endDate).split("T")[0]}`,
    );

    const result = yield* Effect.either(
      service.stream({
        date: startDate,
        updatedBeforeDate: endDate,
      }),
    );

    if (result._tag === "Left") {
      yield* Console.error(`❌ Error: ${result.left}`);
      break;
    }

    const jobs = result.right;
    const activeAds = jobs.filter((ad) => !ad.removed);
    const removedAds = jobs.filter((ad) => ad.removed);

    yield* Console.log(
      `   ✅ Total: ${jobs.length} (${activeAds.length} active, ${removedAds.length} removed)`,
    );
  }

  yield* Console.log("\n🎉 Multi-day test complete!");
});

Effect.runPromise(
  program.pipe(
    Effect.provide(PlatsbankenService.Default),
    Effect.tapError((error) => Console.error("Error:", error)),
  ),
)
  .then(() => console.log("Done!"))
  .catch((error) => console.error("Failed:", error));
