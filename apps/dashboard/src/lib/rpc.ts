import { FetchHttpClient } from "@effect/platform";
import * as RpcClient from "@effect/rpc/RpcClient";
import * as RpcSerialization from "@effect/rpc/RpcSerialization";
import { AtomRpc } from "@effect-atom/atom-react";
import { Rpcs } from "@repo/domain";
import * as Layer from "effect/Layer";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "localhost:9090";

export class ApiAtom extends AtomRpc.Tag<ApiAtom>()("httpApi", {
  group: Rpcs,
  protocol: RpcClient.layerProtocolHttp({
    url: `http://${SERVER_URL}/`,
  }).pipe(
    Layer.provide(FetchHttpClient.layer),
    Layer.provide(RpcSerialization.layerNdjson)
  ),
}) {}

export const api = ApiAtom;
