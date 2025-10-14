import { Console, Effect } from "effect";
import { PlatsbankenService } from "./integrations/platsbanken";
import { writeFileSync } from "node:fs";

const program = Effect.gen(function* () {
  yield* Console.log("Fetching snapshot of all published ads...");
  const service = yield* PlatsbankenService;
  const allJobs = yield* service.snapshot();

  const filename = `platsbanken-snapshot-${new Date().toISOString().split("T")[0]}.json`;

  yield* Console.log(`\nSaving ${allJobs.length} ads to ${filename}...`);
  writeFileSync(filename, JSON.stringify(allJobs, null, 2));

  yield* Console.log(`✅ Saved to ${filename}`);
  yield* Console.log(`📊 File size: ${(JSON.stringify(allJobs).length / 1024 / 1024).toFixed(2)} MB`);
});

Effect.runPromise(
  program.pipe(
    Effect.provide(PlatsbankenService.Default),
    Effect.tapError((error) => Console.error("Error:", error)),
  ),
)
  .then(() => console.log("Done!"))
  .catch((error) => console.error("Failed:", error));
