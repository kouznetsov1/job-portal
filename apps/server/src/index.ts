import { HttpRouter } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { RpcLayer } from "./rpcs";

const HttpProtocol = RpcServer.layerProtocolHttp({
  path: "/",
}).pipe(Layer.provide(RpcSerialization.layerNdjson));

const Main = HttpRouter.Default.serve().pipe(
  Layer.provide(RpcLayer),
  Layer.provide(HttpProtocol),
  Layer.provide(BunHttpServer.layer({ port: 9090 })),
);

BunRuntime.runMain(Layer.launch(Main));
