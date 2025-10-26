import { AtomRpc } from "@effect-atom/atom-react";
import * as RpcClient from "@effect/rpc/RpcClient";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import { Rpcs } from "@repo/domain";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { FetchHttpClient } from "@effect/platform";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "localhost:9090";

export class httpApi extends AtomRpc.Tag<httpApi>()("httpApi", {
  group: Rpcs,
  protocol: RpcClient.layerProtocolHttp({
    url: `http://${SERVER_URL}/`,
  }).pipe(
    Layer.provide(FetchHttpClient.layer),
    Layer.provide(RpcSerialization.layerNdjson),
  ),
}) {}

export const ProtocolLive = RpcClient.layerProtocolHttp({
  url: `http://${SERVER_URL}/`,
}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));

export class ApiClient extends Effect.Service<ApiClient>()("ApiClient", {
  scoped: Effect.gen(function* () {
    const client = yield* RpcClient.make(Rpcs);
    return client;
  }).pipe(Effect.provide(ProtocolLive)),
}) {}

export const api = httpApi;
