import { FetchHttpClient, HttpLayerRouter } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { RpcHandlers } from "./handlers";
import { Rpcs } from "@repo/domain";
import { PlatsbankenSyncSchedulerLayer } from "./services/platsbanken/platsbanken-sync";

const HttpRoute = RpcServer.layerHttpRouter({
  group: Rpcs,
  path: "/",
  protocol: "http",
}).pipe(
  Layer.provide(RpcHandlers),
  Layer.provide(RpcSerialization.layerNdjson),
);

const Routes = Layer.mergeAll(HttpRoute).pipe(
  Layer.provide(HttpLayerRouter.cors()),
);

const Main = Layer.mergeAll(
  HttpLayerRouter.serve(Routes).pipe(
    Layer.provide(BunHttpServer.layer({ port: 9090 })),
  ),
  PlatsbankenSyncSchedulerLayer,
).pipe(Layer.provide(FetchHttpClient.layer));

BunRuntime.runMain(Layer.launch(Main));
