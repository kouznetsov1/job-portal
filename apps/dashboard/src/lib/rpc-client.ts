import { AtomRpc } from "@effect-atom/atom-react";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { Rpcs } from "@repo/domain";
import { Layer } from "effect";
import { BrowserSocket } from "@effect/platform-browser";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "localhost:9090";

export class api extends AtomRpc.Tag<api>()("api", {
  group: Rpcs,
  protocol: RpcClient.layerProtocolSocket({
    retryTransientErrors: true,
  }).pipe(
    Layer.provide(BrowserSocket.layerWebSocket(`ws://${SERVER_URL}/rpc`)),
    Layer.provide(RpcSerialization.layerNdjson),
  ),
}) {}
