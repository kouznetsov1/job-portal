import { FetchHttpClient, HttpClient } from "@effect/platform";
import { Console, DateTime, Effect, Schedule, Schema } from "effect";
import { JobStreamResponse } from "@repo/domain";

const formatDateTime = (dt: DateTime.DateTime): string =>
  DateTime.formatIso(dt).split(".")[0]!;

export class PlatsbankenService extends Effect.Service<PlatsbankenService>()(
  "PlatsbankenService",
  {
    dependencies: [FetchHttpClient.layer],
    effect: Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient;
      const baseUrl = "https://jobstream.api.jobtechdev.se";

      const snapshot = () =>
        Effect.gen(function* () {
          yield* Console.log("Fetching snapshot of all published ads...");

          const res = yield* client
            .pipe(
              HttpClient.retryTransient({
                times: 5,
                schedule: Schedule.jittered(Schedule.exponential("1 second")),
              }),
            )
            .get(`${baseUrl}/snapshot`, {
              headers: {
                Accept: "application/json",
                "Accept-Language": "sv",
              },
            })
            .pipe(
              Effect.flatMap((httpResponse) => httpResponse.json),
              Effect.flatMap(Schema.decodeUnknown(JobStreamResponse)),
            );

          yield* Console.log(`Snapshot fetched: ${res.length} ads`);
          return res;
        });

      const stream = (options: {
        date: DateTime.DateTime;
        updatedBeforeDate?: DateTime.DateTime;
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

          yield* Console.log(
            `Fetching stream since ${formatDateTime(options.date)}...`,
          );

          const res = yield* client
            .pipe(
              HttpClient.retryTransient({
                times: 5,
                schedule: Schedule.jittered(Schedule.exponential("1 second")),
              }),
            )
            .get(`${baseUrl}/stream?${queryParams}`, {
              headers: {
                Accept: "application/json",
                "Accept-Language": "sv",
              },
            })
            .pipe(
              Effect.flatMap((httpResponse) => httpResponse.json),
              Effect.flatMap(Schema.decodeUnknown(JobStreamResponse)),
            );

          const activeAds = res.filter((ad) => !ad.removed);
          const removedAds = res.filter((ad) => ad.removed);

          yield* Console.log(
            `Stream fetched: ${activeAds.length} active, ${removedAds.length} removed`,
          );

          return res;
        });

      return {
        snapshot,
        stream,
      };
    }),
  },
) {}
