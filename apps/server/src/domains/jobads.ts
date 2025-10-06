import { Rpc } from "@effect/rpc";
import { Effect, Layer } from "effect";
import { JobAdsRpcs } from "@repo/domain";
import { JobAdsService } from "../services/JobAdsService";

export const JobAdsLiveHandler: Layer.Layer<
  | Rpc.Handler<"jobads.search">
  | Rpc.Handler<"jobads.getById">
  | Rpc.Handler<"jobads.typeahead">
> = JobAdsRpcs.toLayer(
  Effect.gen(function* () {
    const jobAdsService = yield* JobAdsService;

    return {
      "jobads.search": (params) => jobAdsService.search(params),
      "jobads.getById": (input) => jobAdsService.getById(input.id),
      "jobads.typeahead": (params) => jobAdsService.typeahead(params),
    };
  }),
).pipe(Layer.provide(JobAdsService.Default));
