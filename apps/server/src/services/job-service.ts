import { Effect, Schema } from "effect";
import { Database, Prisma } from "@repo/db";
import {
  Job,
  JobSearchError,
  JobNotFoundError,
  JobSearchParams,
} from "@repo/domain";

export class JobService extends Effect.Service<JobService>()("JobService", {
  scoped: Effect.gen(function* () {
    const db = yield* Database;

    const buildWhereClause = (params: JobSearchParams): Prisma.JobWhereInput => {
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

        const jobs = yield* Effect.all(
          rawJobs.map((job) => Schema.decodeUnknown(Job)(job)),
        );

        return { jobs, total, page, pageSize };
      }).pipe(
        Effect.mapError(() => new JobSearchError({ message: "Sökningen misslyckades" })),
      );

    const getById = (id: string) =>
      Effect.gen(function* () {
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

        return yield* Schema.decodeUnknown(Job)(rawJob);
      }).pipe(
        Effect.mapError(() => new JobSearchError({ message: "Kunde inte hämta jobb" })),
      );

    return { search, getById };
  }),
}) {}
