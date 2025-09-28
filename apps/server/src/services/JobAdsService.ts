import { FetchHttpClient, HttpClient } from "@effect/platform";
import { Effect, Schema } from "effect";
import {
  JobAd,
  JobAdSearchParams,
  SearchResults,
  TypeaheadParams,
  TypeaheadResults,
} from "@repo/domain";

export class JobAdsService extends Effect.Service<JobAdsService>()(
  "JobAdsService",
  {
    effect: Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;

      // JobTech API base URL (Swedish job ads API)
      const baseUrl = "https://jobsearch.api.jobtechdev.se";

      return {
        search: (params: typeof JobAdSearchParams.Type) =>
          Effect.gen(function* () {
            // Build query parameters
            const queryParams = new URLSearchParams();

            if (params.q) queryParams.append("q", params.q);
            if (params.offset)
              queryParams.append("offset", params.offset.toString());
            if (params.limit)
              queryParams.append("limit", params.limit.toString());
            if (params.sort) queryParams.append("sort", params.sort);

            // Add array parameters
            params["occupation-name"]?.forEach((v) =>
              queryParams.append("occupation-name", v),
            );
            params.skill?.forEach((v) => queryParams.append("skill", v));
            params.municipality?.forEach((v) =>
              queryParams.append("municipality", v),
            );
            params.region?.forEach((v) => queryParams.append("region", v));

            // Add other parameters
            if (params["published-after"])
              queryParams.append("published-after", params["published-after"]);
            if (params["published-before"])
              queryParams.append(
                "published-before",
                params["published-before"],
              );
            if (params.experience !== undefined)
              queryParams.append("experience", params.experience.toString());
            if (params.remote !== undefined)
              queryParams.append("remote", params.remote.toString());

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

        typeahead: (params: typeof TypeaheadParams.Type) =>
          Effect.gen(function* () {
            const queryParams = new URLSearchParams();

            if (params.q) queryParams.append("q", params.q);
            if (params.limit)
              queryParams.append("limit", params.limit.toString());
            if (params.contextual !== undefined)
              queryParams.append("contextual", params.contextual.toString());
            params.label?.forEach((v) => queryParams.append("label", v));

            const response = yield* client
              .get(`${baseUrl}/complete?${queryParams}`, {
                headers: {
                  Accept: "application/json",
                  "Accept-Language": "sv",
                },
              })
              .pipe(
                Effect.flatMap((response) => response.json),
                Effect.flatMap(Schema.decodeUnknown(TypeaheadResults)),
              );

            return response;
          }),
      };
    }).pipe(Effect.provide(FetchHttpClient.layer)),
  },
) {}
