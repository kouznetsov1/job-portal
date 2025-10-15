import { HttpLayerRouter } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Layer, Effect, Schedule, Console, Cron } from "effect";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { RpcHandlers } from "./rpcs";
import { Rpcs } from "@repo/domain";
import { PlatsbankenSyncService } from "./services/platsbanken-sync";
import { Database } from "@repo/db";
import { PlatsbankenService } from "./integrations/platsbanken";

// WebSocket protocol for real-time/streaming operations (ws://localhost:9090/)
const WebSocketRoute = RpcServer.layerHttpRouter({
  group: Rpcs,
  path: "/",
  protocol: "websocket",
}).pipe(Layer.provide(RpcHandlers), Layer.provide(RpcSerialization.layerJson));

// HTTP protocol for cacheable requests (http://localhost:9090/)
const HttpRoute = RpcServer.layerHttpRouter({
  group: Rpcs,
  path: "/",
  protocol: "http",
}).pipe(Layer.provide(RpcHandlers), Layer.provide(RpcSerialization.layerJson));

// Combine routes and add CORS middleware
const Routes = Layer.mergeAll(WebSocketRoute, HttpRoute).pipe(
  Layer.provide(HttpLayerRouter.cors()),
);

// Hourly job sync scheduler
const hourlySchedule = Schedule.cron(Cron.unsafeParse("0 * * * *"));

const JobSyncScheduler = Effect.gen(function* () {
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

// Serve the routes
const Main = Layer.mergeAll(
  HttpLayerRouter.serve(Routes).pipe(
    Layer.provide(BunHttpServer.layer({ port: 9090 })),
  ),
  Layer.effectDiscard(JobSyncScheduler),
);

BunRuntime.runMain(Layer.launch(Main));
