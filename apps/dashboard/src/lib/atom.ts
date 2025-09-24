import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Atom } from "@effect-atom/atom-react";
import { Api } from "@repo/domain";
import { Effect } from "effect";
import { RpcClient } from "./rpc-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:9000";

const runtime = Atom.runtime(RpcClient.Default);

export const jobAtom = runtime.fn(() =>
  Effect.gen(function* () {
    const client = yield* HttpApiClient.make(Api, {
      baseUrl: SERVER_URL,
    });
    return yield* client.job.get();
  }).pipe(Effect.provide(FetchHttpClient.layer)),
);
