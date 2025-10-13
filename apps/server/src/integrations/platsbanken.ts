import { FetchHttpClient, HttpClient } from "@effect/platform";
import {
  Chunk,
  Console,
  Data,
  Duration,
  Effect,
  Option,
  Schedule,
  Schema,
  Stream,
} from "effect";
import { SearchResults } from "@repo/domain";

class RateLimitError extends Data.TaggedError("RateLimitError")<{
  readonly status: number;
  readonly retryAfterSeconds: number;
}> {
  override get message(): string {
    return `Rate limit exceeded (429), retry after ${this.retryAfterSeconds}s`;
  }
}

const parseRetryAfter = (retryAfter: string | undefined): number => {
  if (!retryAfter) return 1;
  const seconds = Number.parseInt(retryAfter, 10);
  return Number.isNaN(seconds) ? 1 : Math.max(1, seconds);
};

export class PlatsbankenService extends Effect.Service<PlatsbankenService>()(
  "PlatsbankenService",
  {
    scoped: Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      const baseUrl = "https://jobsearch.api.jobtechdev.se";
      const limit = 100;

      const fetchPage = (offset: number) =>
        Effect.gen(function* () {
          const queryParams = new URLSearchParams();
          queryParams.set("limit", String(limit));
          queryParams.set("offset", String(offset));

          const response = yield* client
            .get(`${baseUrl}/search?${queryParams}`, {
              headers: {
                Accept: "application/json",
                "Accept-Language": "sv",
              },
            })
            .pipe(
              Effect.flatMap((httpResponse) => {
                if (httpResponse.status === 429) {
                  const retryAfter = httpResponse.headers["retry-after"];
                  return Effect.fail(
                    new RateLimitError({
                      status: 429,
                      retryAfterSeconds: parseRetryAfter(retryAfter),
                    }),
                  );
                }
                return Effect.succeed(httpResponse);
              }),
              Effect.flatMap((httpResponse) => httpResponse.json),
              Effect.flatMap(Schema.decodeUnknown(SearchResults)),
            );

          return response;
        });

      return {
        getAll: () =>
          Effect.gen(function* () {
            const allJobs = yield* Stream.paginateChunkEffect(0, (offset) =>
              fetchPage(offset).pipe(
                Effect.retry(
                  Schedule.exponential(Duration.seconds(1)).pipe(
                    Schedule.intersect(Schedule.recurs(5)),
                  ),
                ),
                Effect.catchTag("RateLimitError", (error) =>
                  Effect.gen(function* () {
                    yield* Effect.sleep(
                      Duration.seconds(error.retryAfterSeconds),
                    );
                    return yield* fetchPage(offset);
                  }).pipe(
                    Effect.retry(
                      Schedule.exponential(Duration.seconds(1)).pipe(
                        Schedule.intersect(Schedule.recurs(3)),
                      ),
                    ),
                  ),
                ),
                Effect.tap((page) =>
                  Console.log(
                    `Fetched ${offset + page.hits.length}/${page.total.value} jobs`,
                  ),
                ),
                Effect.andThen((page) => {
                  const currentOffset = offset;
                  const totalResults = page.total.value;
                  const hasMore = currentOffset + limit < totalResults;

                  return [
                    Chunk.fromIterable(page.hits),
                    hasMore
                      ? Option.some(offset + limit)
                      : Option.none<number>(),
                  ] as const;
                }),
              ),
            ).pipe(Stream.runCollect);

            return allJobs;
          }),
      };
    }).pipe(Effect.provide(FetchHttpClient.layer)),
  },
) {}
