import { HttpApiBuilder, HttpRouter } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { RpcLayer } from "./rpcs";

const WebSocketProtocol = RpcServer.layerProtocolWebsocket({
  path: "/rpc",
}).pipe(Layer.provide(RpcSerialization.layerNdjson));

const Main = HttpRouter.Default.serve().pipe(
  Layer.provide(HttpApiBuilder.middlewareCors()),
  Layer.provide(RpcLayer),
  Layer.provide(WebSocketProtocol),
  Layer.provide(BunHttpServer.layer({ port: 9090 })),
);

BunRuntime.runMain(Layer.launch(Main));
