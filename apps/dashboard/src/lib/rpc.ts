import { AtomRpc } from "@effect-atom/atom-react";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { Rpcs } from "@repo/domain";
import { Effect, Layer } from "effect";
import { BrowserSocket } from "@effect/platform-browser";
import { FetchHttpClient } from "@effect/platform";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "localhost:9090";

export class httpApi extends AtomRpc.Tag<httpApi>()("httpApi", {
  group: Rpcs,
  protocol: RpcClient.layerProtocolHttp({
    url: `http://${SERVER_URL}/`,
  }).pipe(
    Layer.provide(FetchHttpClient.layer),
    Layer.provide(RpcSerialization.layerJson),
  ),
}) {}

export class wsApi extends AtomRpc.Tag<wsApi>()("wsApi", {
  group: Rpcs,
  protocol: RpcClient.layerProtocolSocket({
    retryTransientErrors: true,
  }).pipe(
    Layer.provide(BrowserSocket.layerWebSocket(`ws://${SERVER_URL}/`)),
    Layer.provide(RpcSerialization.layerJson),
  ),
}) {}

export const ProtocolLive = RpcClient.layerProtocolHttp({
  url: `http://${SERVER_URL}/`,
}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerJson]));

export class ApiClient extends Effect.Service<ApiClient>()("ApiClient", {
  effect: Effect.gen(function* () {
    const client = yield* RpcClient.make(Rpcs);
    return client;
  }).pipe(Effect.provide(ProtocolLive)),
}) {}

export const api = httpApi;
