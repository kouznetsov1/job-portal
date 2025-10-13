import { Console, Effect } from "effect";
import { PlatsbankenService } from "./integrations/platsbanken";

const program = Effect.gen(function* () {
  yield* Console.log("Starting fetch...");
  const service = yield* PlatsbankenService;
  yield* Console.log("Service acquired, fetching jobs...");
  const allJobs = yield* service.getAll();

  yield* Console.log(`\nTotal jobs fetched: ${allJobs.length}`);
});

Effect.runPromise(
  program.pipe(
    Effect.provide(PlatsbankenService.Default),
    Effect.tapError((error) => Console.error("Error:", error)),
  ),
)
  .then(() => console.log("Done!"))
  .catch((error) => console.error("Failed:", error));
