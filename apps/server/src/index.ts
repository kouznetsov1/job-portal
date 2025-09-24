import { HttpLayerRouter, HttpServer } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Api } from "@repo/domain/Api";
import { Config, Layer } from "effect";
import { HealthGroupLive } from "./handlers/health";
import { JobGroupLive } from "./handlers/job";

const ApiRouter = HttpLayerRouter.addHttpApi(Api).pipe(
  Layer.provide(Layer.merge(HealthGroupLive, JobGroupLive)),
);

const AllRouters = Layer.mergeAll(ApiRouter).pipe(
  Layer.provide(
    HttpLayerRouter.cors({
      allowedOrigins: ["*"],
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "B3", "traceparent"],
      credentials: true,
    }),
  ),
);

const ServerConfig = Config.all({
  port: Config.number("PORT").pipe(Config.withDefault(9000)),
});

const HttpLive = HttpLayerRouter.serve(AllRouters).pipe(
  HttpServer.withLogAddress,
  Layer.provideMerge(BunHttpServer.layerConfig(ServerConfig)),
);

BunRuntime.runMain(Layer.launch(HttpLive));
