import { FetchHttpClient, HttpClient } from "@effect/platform";
import { Console, Data, DateTime, Duration, Effect, Schema } from "effect";
import { JobStreamResponse } from "@repo/domain";
import { HttpClientResponse } from "@effect/platform/HttpClientResponse";

class RateLimitError extends Data.TaggedError("RateLimitError")<{
  readonly retryAfterSeconds: number;
}> {
  override get message(): string {
    return `Rate limit exceeded, retry after ${this.retryAfterSeconds}s`;
  }
}

const parseRetryAfter = (retryAfter: string | undefined) => {
  if (!retryAfter) return 1;
  const seconds = Number.parseInt(retryAfter, 10);
  return Number.isNaN(seconds) ? 1 : Math.max(1, seconds);
};

const formatDateTime = (dt: DateTime.DateTime): string => {
  return DateTime.formatIso(dt).split(".")[0]!;
};

export class PlatsbankenService extends Effect.Service<PlatsbankenService>()(
  "PlatsbankenService",
  {
    scoped: Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      const baseUrl = "https://jobstream.api.jobtechdev.se";

      const handleResponse = (httpResponse: HttpClientResponse) =>
        Effect.gen(function* () {
          if (httpResponse.status === 429) {
            const retryAfter = httpResponse.headers["retry-after"];
            return yield* Effect.fail(
              new RateLimitError({
                retryAfterSeconds: parseRetryAfter(retryAfter),
              }),
            );
          }
          if (httpResponse.status !== 200) {
            const errorBody = yield* httpResponse.text;
            yield* Console.error(
              `HTTP ${httpResponse.status} error: ${errorBody}`,
            );
            return yield* Effect.fail(
              new Error(
                `HTTP ${httpResponse.status}: ${errorBody.substring(0, 200)}`,
              ),
            );
          }
          return httpResponse;
        });

      return {
        snapshot: () =>
          Effect.gen(function* () {
            yield* Console.log("Fetching snapshot of all published ads...");

            const response = yield* client
              .get(`${baseUrl}/snapshot`, {
                headers: {
                  Accept: "application/json",
                  "Accept-Language": "sv",
                },
              })
              .pipe(
                Effect.flatMap(handleResponse),
                Effect.flatMap((httpResponse) => httpResponse.json),
                Effect.flatMap(Schema.decodeUnknown(JobStreamResponse)),
                Effect.retry({
                  while: (error) =>
                    error.name === "RateLimitError"
                      ? Effect.sleep(
                          Duration.seconds(
                            (error as RateLimitError).retryAfterSeconds,
                          ),
                        ).pipe(Effect.as(true))
                      : Effect.succeed(false),
                }),
              );

            yield* Console.log(`✅ Snapshot fetched: ${response.length} ads`);
            return response;
          }),

        stream: (options: {
          date: DateTime.DateTime;
          updatedBeforeDate?: DateTime.DateTime;
          occupationConceptIds?: readonly string[];
          locationConceptIds?: readonly string[];
        }) =>
          Effect.gen(function* () {
            const queryParams = new URLSearchParams();
            queryParams.set("date", formatDateTime(options.date));

            if (options.updatedBeforeDate) {
              queryParams.set(
                "updated-before-date",
                formatDateTime(options.updatedBeforeDate),
              );
            }

            if (options.occupationConceptIds) {
              for (const id of options.occupationConceptIds) {
                queryParams.append("occupation-concept-id", id);
              }
            }

            if (options.locationConceptIds) {
              for (const id of options.locationConceptIds) {
                queryParams.append("location-concept-id", id);
              }
            }

            yield* Console.log(
              `Fetching stream since ${formatDateTime(options.date)}...`,
            );

            const response = yield* client
              .get(`${baseUrl}/stream?${queryParams}`, {
                headers: {
                  Accept: "application/json",
                  "Accept-Language": "sv",
                },
              })
              .pipe(
                Effect.flatMap(handleResponse),
                Effect.flatMap((httpResponse) => httpResponse.json),
                Effect.flatMap(Schema.decodeUnknown(JobStreamResponse)),
                Effect.retry({
                  while: (error) =>
                    error.name === "RateLimitError"
                      ? Effect.sleep(
                          Duration.seconds(
                            (error as RateLimitError).retryAfterSeconds,
                          ),
                        ).pipe(Effect.as(true))
                      : Effect.succeed(false),
                }),
              );

            const activeAds = response.filter((ad) => !ad.removed);
            const removedAds = response.filter((ad) => ad.removed);

            yield* Console.log(
              `✅ Stream fetched: ${activeAds.length} active, ${removedAds.length} removed`,
            );

            return response;
          }),
      };
    }).pipe(Effect.provide(FetchHttpClient.layer)),
  },
) {}
