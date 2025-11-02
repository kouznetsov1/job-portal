import { Effect, Schema, Option } from "effect";
import { Database, type Prisma } from "@repo/db";
import {
  Job,
  JobSearchResult,
  JobNotFoundError,
  JobSearchError,
  type JobSearchParams,
} from "@repo/domain";

export class JobService extends Effect.Service<JobService>()("JobService", {
  scoped: Effect.gen(function* () {
    const db = yield* Database;

    const buildWhereClause = (
      params: JobSearchParams,
    ): Prisma.JobWhereInput => {
      const where: Prisma.JobWhereInput = { removed: false };

      Option.fromNullable(params.q).pipe(
        Option.filter((q) => q.trim().length > 0),
        Option.match({
          onNone: () => {},
          onSome: (query) => {
            where.OR = [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { company: { name: { contains: query, mode: "insensitive" } } },
            ];
          },
        }),
      );

      const stringFilters = [
        "occupation",
        "occupationGroup",
        "occupationField",
        "city",
        "municipality",
        "region",
        "employmentType",
        "workingHoursType",
      ] as const;

      for (const field of stringFilters) {
        Option.fromNullable(params[field]).pipe(
          Option.match({
            onNone: () => {},
            onSome: (value) => {
              where[field] = { contains: value, mode: "insensitive" };
            },
          }),
        );
      }

      Option.fromNullable(params.remote).pipe(
        Option.match({
          onNone: () => {},
          onSome: (value) => {
            where.remote = value;
          },
        }),
      );

      Option.fromNullable(params.experienceRequired).pipe(
        Option.match({
          onNone: () => {},
          onSome: (value) => {
            where.experienceRequired = value;
          },
        }),
      );

      return where;
    };

    const search = (params: JobSearchParams) =>
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
          hasQuery: !!params.q,
        });

        const page = params.page ?? 1;
        const pageSize = params.pageSize ?? 20;
        const skip = (page - 1) * pageSize;
        const where = buildWhereClause(params);

        const [rawJobs, total] = yield* Effect.all([
          db.use((p) =>
            p.job.findMany({
              where,
              include: {
                company: true,
                sources: true,
                requirements: true,
                contacts: true,
              },
              orderBy: { publishedAt: "desc" },
              take: pageSize,
              skip,
            }),
          ),
          db.use((p) => p.job.count({ where })),
        ]);

        yield* Effect.annotateCurrentSpan({ jobCount: rawJobs.length, total });

        const result = yield* Schema.decodeUnknown(JobSearchResult)(
          JSON.parse(JSON.stringify({ jobs: rawJobs, total, page, pageSize })),
        ).pipe(
          Effect.mapError(
            (error) =>
              new JobSearchError({
                message: `Failed to validate search results: ${error.message}`,
              }),
          ),
        );

        return result;
      }).pipe(
        Effect.withSpan("JobService.search"),
        Effect.annotateLogs("service", "JobService"),
        Effect.tapError((error) =>
          Effect.logError("Job search operation failed", error),
        ),
      );

    const getById = (id: string) =>
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({ jobId: id });

        const rawJobOption = yield* db
          .use((p) =>
            p.job.findUnique({
              where: { id },
              include: {
                company: true,
                sources: true,
                requirements: true,
                contacts: true,
              },
            }),
          )
          .pipe(Effect.map(Option.fromNullable));

        const rawJob = yield* Option.match(rawJobOption, {
          onNone: () => Effect.fail(new JobNotFoundError({ jobId: id })),
          onSome: Effect.succeed,
        });

        const job = yield* Schema.decodeUnknown(Job)(
          JSON.parse(JSON.stringify(rawJob)),
        ).pipe(
          Effect.mapError(
            (error) =>
              new JobSearchError({
                message: `Failed to validate job data: ${error.message}`,
              }),
          ),
        );

        return job;
      }).pipe(
        Effect.withSpan("JobService.getById"),
        Effect.annotateLogs({ service: "JobService", jobId: id }),
        Effect.tapError((error) =>
          Effect.logError("Get job by ID operation failed", error),
        ),
      );

    return { search, getById };
  }),
}) {}
