import { HttpLayerRouter } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { RpcHandlers } from "./rpcs";
import { Rpcs } from "@repo/domain";

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

// Serve the routes
const Main = HttpLayerRouter.serve(Routes).pipe(
  Layer.provide(BunHttpServer.layer({ port: 9090 })),
);

BunRuntime.runMain(Layer.launch(Main));
