import { FetchHttpClient, HttpClient } from "@effect/platform";
import { Effect, Schema } from "effect";
import { JobAd, PlatsbankenSearchInput, SearchResults } from "@repo/domain";

export class JobAdsService extends Effect.Service<JobAdsService>()(
  "JobAdsService",
  {
    scoped: Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      const baseUrl = "https://jobsearch.api.jobtechdev.se";

      return {
        search: (params: typeof PlatsbankenSearchInput.Type) =>
          Effect.gen(function* () {
            const queryParams = new URLSearchParams();

            if (params.q) queryParams.append("q", params.q);
            if (params.limit)
              queryParams.append("limit", params.limit.toString());

            const response = yield* client
              .get(`${baseUrl}/search?${queryParams}`, {
                headers: {
                  Accept: "application/json",
                  "Accept-Language": "sv",
                },
              })
              .pipe(
                Effect.flatMap((response) => response.json),
                Effect.flatMap(Schema.decodeUnknown(SearchResults)),
              );

            return response;
          }),

        getById: (id: string) =>
          Effect.gen(function* () {
            const response = yield* client
              .get(`${baseUrl}/ad/${id}`, {
                headers: {
                  Accept: "application/json",
                  "Accept-Language": "sv",
                },
              })
              .pipe(
                Effect.flatMap((response) => response.json),
                Effect.flatMap(Schema.decodeUnknown(JobAd)),
              );

            return response;
          }),
      };
    }).pipe(Effect.provide(FetchHttpClient.layer)),
  },
) {}
