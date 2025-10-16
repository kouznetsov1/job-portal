import { Effect, Schedule, Console, Cron, Layer } from "effect";
import { PlatsbankenSyncService } from "../services/platsbanken-sync";
import { PlatsbankenService } from "../integrations/platsbanken";
import { Database } from "@repo/db";

const hourlySchedule = Schedule.cron(Cron.unsafeParse("0 * * * *"));

export const JobSyncScheduler = Effect.gen(function* () {
  const syncService = yield* PlatsbankenSyncService;

  yield* Console.log("Job sync scheduler started");

  const runSync = syncService.syncJobs.pipe(
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        yield* Console.error(`Sync failed: ${error}`);
        return { imported: 0, removed: 0, failed: 0 };
      }),
    ),
  );

  yield* runSync.pipe(Effect.repeat(hourlySchedule));
}).pipe(
  Effect.provide(PlatsbankenSyncService.Default),
  Effect.provide(PlatsbankenService.Default),
  Effect.provide(Database.Live),
  Effect.forkDaemon,
);

export const JobSyncSchedulerLayer = Layer.effectDiscard(JobSyncScheduler);

export const getCronScheduleInfo = () => {
  const cron = Cron.unsafeParse("0 * * * *");
  const now = new Date();
  const nextRun = Cron.next(cron, now);
  const upcomingRuns = [];

  let currentDate = now;
  for (let i = 0; i < 5; i++) {
    const nextDate = Cron.next(cron, currentDate);
    upcomingRuns.push(nextDate);
    currentDate = nextDate;
  }

  return {
    cron: "0 * * * *",
    description: "Every hour at minute 0",
    nextRun,
    upcomingRuns,
  };
};
