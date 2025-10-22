import { Effect, Schema } from "effect";
import { Database, Prisma } from "@repo/db";
import {
  Job,
  JobSearchResult,
  JobSearchError,
  JobNotFoundError,
  JobSearchParams,
} from "@repo/domain";

export class JobService extends Effect.Service<JobService>()("JobService", {
  scoped: Effect.gen(function* () {
    const db = yield* Database;

    const buildWhereClause = (
      params: JobSearchParams,
    ): Prisma.JobWhereInput => {
      const where: Prisma.JobWhereInput = { removed: false };

      if (params.q) {
        where.OR = [
          { title: { contains: params.q, mode: "insensitive" } },
          { description: { contains: params.q, mode: "insensitive" } },
          { company: { name: { contains: params.q, mode: "insensitive" } } },
        ];
      }

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
        if (params[field]) {
          where[field] = { contains: params[field], mode: "insensitive" };
        }
      }

      if (params.remote !== undefined) where.remote = params.remote;
      if (params.experienceRequired !== undefined)
        where.experienceRequired = params.experienceRequired;

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
        );

        return result;
      }).pipe(
        Effect.withSpan("JobService.search"),
        Effect.annotateLogs("service", "JobService"),
        Effect.tapError((error) =>
          Effect.logError("Job search operation failed", error),
        ),
        Effect.mapError(
          () => new JobSearchError({ message: "Sökningen misslyckades" }),
        ),
      );

    const getById = (id: string) =>
      Effect.gen(function* () {
        yield* Effect.annotateCurrentSpan({ jobId: id });

        const rawJob = yield* db.use((p) =>
          p.job.findUnique({
            where: { id },
            include: {
              company: true,
              sources: true,
              requirements: true,
              contacts: true,
            },
          }),
        );

        if (!rawJob) {
          return yield* Effect.fail(new JobNotFoundError({ jobId: id }));
        }

        const job = yield* Schema.decodeUnknown(Job)(
          JSON.parse(JSON.stringify(rawJob)),
        );

        return job;
      }).pipe(
        Effect.withSpan("JobService.getById"),
        Effect.annotateLogs({ service: "JobService", jobId: id }),
        Effect.tapError((error) =>
          Effect.logError("Get job by ID operation failed", error),
        ),
        Effect.mapError(
          () => new JobSearchError({ message: "Kunde inte hämta jobb" }),
        ),
      );

    return { search, getById };
  }),
}) {}
