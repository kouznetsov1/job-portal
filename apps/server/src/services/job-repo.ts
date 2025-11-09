import { Database } from "@repo/db";
import type { Prisma } from "@repo/db";
import {
  Job,
  JobId,
  JobNotFoundError,
  type JobSearchParams,
  JobSourceLink,
  JobRequirement,
  JobContact,
  CompanyId,
} from "@repo/domain";
import { Effect } from "effect";

export class JobRepo extends Effect.Service<JobRepo>()("JobRepo", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    const search = (params: typeof JobSearchParams.Type, userId?: string) =>
      Effect.fn("job.search")(function* () {
        const limit = params.limit ?? 20;
        const offset = params.offset ?? 0;

        const where: Prisma.JobWhereInput = {
          removed: false,
        };

        if (params.q) {
          where.OR = [
            { title: { contains: params.q, mode: "insensitive" } },
            { description: { contains: params.q, mode: "insensitive" } },
          ];
        }

        let userEmbeddingString: string | undefined;
        if (userId) {
          const result = yield* db.use((client) =>
            client.$queryRaw<Array<{ perfect_job_embedding: string | null }>>`
              SELECT perfect_job_embedding::text as perfect_job_embedding
              FROM user_profile
              WHERE user_id = ${userId}::uuid
            `
          );

          if (result[0]?.perfect_job_embedding) {
            userEmbeddingString = result[0].perfect_job_embedding;
          }
        }

        let jobs: Array<{
          id: string;
          match_score?: number;
        }>;

        if (userEmbeddingString) {
          let query = `
            SELECT
              j.id,
              ROUND((1 - (j.ai_summary_embedding <=> $1::vector)) * 100) as match_score
            FROM job j
            WHERE j.removed = FALSE
              AND j.ai_summary_embedding IS NOT NULL
          `;

          const queryParams: (string | number)[] = [userEmbeddingString];
          let paramIndex = 2;

          if (params.q) {
            query += ` AND (j.title ILIKE $${paramIndex} OR j.description ILIKE $${paramIndex})`;
            queryParams.push(`%${params.q}%`);
            paramIndex++;
          }

          if (params.minMatchScore || params.maxMatchScore) {
            query += ` HAVING TRUE`;
            if (params.minMatchScore) {
              query += ` AND match_score >= $${paramIndex}`;
              queryParams.push(params.minMatchScore);
              paramIndex++;
            }
            if (params.maxMatchScore) {
              query += ` AND match_score <= $${paramIndex}`;
              queryParams.push(params.maxMatchScore);
              paramIndex++;
            }
          }

          if (params.sortByMatch) {
            query += ` ORDER BY match_score DESC, j.published_at DESC`;
          } else {
            query += ` ORDER BY j.published_at DESC`;
          }

          query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
          queryParams.push(limit, offset);

          jobs = yield* db.use((client) =>
            client.$queryRawUnsafe<Array<{ id: string; match_score: number }>>(
              query,
              ...queryParams
            )
          );
        } else {
          jobs = yield* db.use((client) =>
            client.job.findMany({
              where,
              select: { id: true },
              take: limit,
              skip: offset,
              orderBy: { publishedAt: "desc" },
            })
          );
        }

        const jobIds = jobs.map((j) => j.id);
        const jobDetails = yield* db.use((client) =>
          client.job.findMany({
            where: { id: { in: jobIds } },
            include: {
              sources: true,
              requirements: true,
              contacts: true,
            },
          })
        );

        const total = yield* db.use((client) =>
          client.job.count({ where })
        );

        const jobsMap = new Map(jobDetails.map((j) => [j.id, j]));
        const matchScoreMap = new Map(
          jobs.map((j) => [j.id, "match_score" in j ? j.match_score : undefined])
        );

        const filteredJobs = jobs.map((jobRef) => {
          const job = jobsMap.get(jobRef.id);
          if (!job) return null;

          const matchScore = matchScoreMap.get(job.id);

          return Job.make({
            id: JobId.make(job.id),
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
            removed: job.removed,
            removedAt: job.removedAt ?? undefined,
            publishedAt: job.publishedAt,
            lastPublicationDate: job.lastPublicationDate ?? undefined,
            expiresAt: job.expiresAt ?? undefined,
            lastChecked: job.lastChecked ?? undefined,
            title: job.title,
            description: job.description,
            url: job.url ?? undefined,
            companyId: job.companyId
              ? CompanyId.make(job.companyId)
              : CompanyId.make(""),
            employmentType: job.employmentType ?? undefined,
            workingHoursType: job.workingHoursType ?? undefined,
            duration: job.duration ?? undefined,
            vacancies: job.vacancies ?? undefined,
            startDate: job.startDate ?? undefined,
            workloadMin: job.workloadMin ?? undefined,
            workloadMax: job.workloadMax ?? undefined,
            salaryMin: job.salaryMin ?? undefined,
            salaryMax: job.salaryMax ?? undefined,
            salaryCurrency: job.salaryCurrency ?? undefined,
            salaryPeriod: job.salaryPeriod ?? undefined,
            salaryType: job.salaryType ?? undefined,
            salaryDescription: job.salaryDescription ?? undefined,
            occupation: job.occupation ?? undefined,
            occupationGroup: job.occupationGroup ?? undefined,
            occupationField: job.occupationField ?? undefined,
            experienceRequired: job.experienceRequired,
            drivingLicenseRequired: job.drivingLicenseRequired,
            accessToOwnCar: job.accessToOwnCar,
            applicationDeadline: job.applicationDeadline ?? undefined,
            applicationInstructions: job.applicationInstructions ?? undefined,
            applicationUrl: job.applicationUrl ?? undefined,
            applicationEmail: job.applicationEmail ?? undefined,
            applicationReference: job.applicationReference ?? undefined,
            applicationViaAf: job.applicationViaAf,
            applicationOther: job.applicationOther ?? undefined,
            workplace: job.workplace ?? undefined,
            remote: job.remote,
            streetAddress: job.streetAddress ?? undefined,
            city: job.city ?? undefined,
            municipality: job.municipality ?? undefined,
            municipalityCode: job.municipalityCode ?? undefined,
            region: job.region ?? undefined,
            regionCode: job.regionCode ?? undefined,
            postalCode: job.postalCode ?? undefined,
            country: job.country,
            countryCode: job.countryCode ?? undefined,
            locationFormatted: job.locationFormatted ?? undefined,
            searchText: job.searchText ?? undefined,
            sources: job.sources.map((source) =>
              JobSourceLink.make({
                id: source.id,
                source: source.source as "PLATSBANKEN",
                sourceId: source.sourceId,
                sourceUrl: source.sourceUrl ?? undefined,
                discoveredAt: source.discoveredAt,
              })
            ),
            requirements: job.requirements.map((req) =>
              JobRequirement.make({
                id: req.id,
                requirementType: req.requirementType,
                category: req.category,
                label: req.label,
                weight: req.weight ?? undefined,
              })
            ),
            contacts: job.contacts.map((contact) =>
              JobContact.make({
                id: contact.id,
                name: contact.name ?? undefined,
                role: contact.role ?? undefined,
                email: contact.email ?? undefined,
                phone: contact.phone ?? undefined,
                description: contact.description ?? undefined,
              })
            ),
            matchScore,
          });
        }).filter((job): job is Job => job !== null);

        return { jobs: filteredJobs, total };
      });

    const getById = (jobId: string) =>
      Effect.fn("job.getById")(function* () {
        const job = yield* db.use((client) =>
          client.job.findUnique({
            where: { id: jobId },
            include: {
              sources: true,
              requirements: true,
              contacts: true,
            },
          })
        );

        if (!job) {
          return yield* Effect.fail(new JobNotFoundError({ id: JobId.make(jobId) }));
        }

        return Job.make({
          id: JobId.make(job.id),
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          removed: job.removed,
          removedAt: job.removedAt ?? undefined,
          publishedAt: job.publishedAt,
          lastPublicationDate: job.lastPublicationDate ?? undefined,
          expiresAt: job.expiresAt ?? undefined,
          lastChecked: job.lastChecked ?? undefined,
          title: job.title,
          description: job.description,
          url: job.url ?? undefined,
          companyId: job.companyId
            ? CompanyId.make(job.companyId)
            : CompanyId.make(""),
          employmentType: job.employmentType ?? undefined,
          workingHoursType: job.workingHoursType ?? undefined,
          duration: job.duration ?? undefined,
          vacancies: job.vacancies ?? undefined,
          startDate: job.startDate ?? undefined,
          workloadMin: job.workloadMin ?? undefined,
          workloadMax: job.workloadMax ?? undefined,
          salaryMin: job.salaryMin ?? undefined,
          salaryMax: job.salaryMax ?? undefined,
          salaryCurrency: job.salaryCurrency ?? undefined,
          salaryPeriod: job.salaryPeriod ?? undefined,
          salaryType: job.salaryType ?? undefined,
          salaryDescription: job.salaryDescription ?? undefined,
          occupation: job.occupation ?? undefined,
          occupationGroup: job.occupationGroup ?? undefined,
          occupationField: job.occupationField ?? undefined,
          experienceRequired: job.experienceRequired,
          drivingLicenseRequired: job.drivingLicenseRequired,
          accessToOwnCar: job.accessToOwnCar,
          applicationDeadline: job.applicationDeadline ?? undefined,
          applicationInstructions: job.applicationInstructions ?? undefined,
          applicationUrl: job.applicationUrl ?? undefined,
          applicationEmail: job.applicationEmail ?? undefined,
          applicationReference: job.applicationReference ?? undefined,
          applicationViaAf: job.applicationViaAf,
          applicationOther: job.applicationOther ?? undefined,
          workplace: job.workplace ?? undefined,
          remote: job.remote,
          streetAddress: job.streetAddress ?? undefined,
          city: job.city ?? undefined,
          municipality: job.municipality ?? undefined,
          municipalityCode: job.municipalityCode ?? undefined,
          region: job.region ?? undefined,
          regionCode: job.regionCode ?? undefined,
          postalCode: job.postalCode ?? undefined,
          country: job.country,
          countryCode: job.countryCode ?? undefined,
          locationFormatted: job.locationFormatted ?? undefined,
          searchText: job.searchText ?? undefined,
          sources: job.sources.map((source) =>
            JobSourceLink.make({
              id: source.id,
              source: source.source as "PLATSBANKEN",
              sourceId: source.sourceId,
              sourceUrl: source.sourceUrl ?? undefined,
              discoveredAt: source.discoveredAt,
            })
          ),
          requirements: job.requirements.map((req) =>
            JobRequirement.make({
              id: req.id,
              requirementType: req.requirementType,
              category: req.category,
              label: req.label,
              weight: req.weight ?? undefined,
            })
          ),
          contacts: job.contacts.map((contact) =>
            JobContact.make({
              id: contact.id,
              name: contact.name ?? undefined,
              role: contact.role ?? undefined,
              email: contact.email ?? undefined,
              phone: contact.phone ?? undefined,
              description: contact.description ?? undefined,
            })
          ),
        });
      });

    const getSaved = (userId: string) =>
      Effect.fn("job.getSaved")(function* () {
        const savedJobs = yield* db.use((client) =>
          client.savedJob.findMany({
            where: { userId },
            include: {
              job: {
                include: {
                  sources: true,
                  requirements: true,
                  contacts: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          })
        );

        return savedJobs.map((saved) => {
          const job = saved.job;
          return Job.make({
            id: JobId.make(job.id),
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
            removed: job.removed,
            removedAt: job.removedAt ?? undefined,
            publishedAt: job.publishedAt,
            lastPublicationDate: job.lastPublicationDate ?? undefined,
            expiresAt: job.expiresAt ?? undefined,
            lastChecked: job.lastChecked ?? undefined,
            title: job.title,
            description: job.description,
            url: job.url ?? undefined,
            companyId: job.companyId
              ? CompanyId.make(job.companyId)
              : CompanyId.make(""),
            employmentType: job.employmentType ?? undefined,
            workingHoursType: job.workingHoursType ?? undefined,
            duration: job.duration ?? undefined,
            vacancies: job.vacancies ?? undefined,
            startDate: job.startDate ?? undefined,
            workloadMin: job.workloadMin ?? undefined,
            workloadMax: job.workloadMax ?? undefined,
            salaryMin: job.salaryMin ?? undefined,
            salaryMax: job.salaryMax ?? undefined,
            salaryCurrency: job.salaryCurrency ?? undefined,
            salaryPeriod: job.salaryPeriod ?? undefined,
            salaryType: job.salaryType ?? undefined,
            salaryDescription: job.salaryDescription ?? undefined,
            occupation: job.occupation ?? undefined,
            occupationGroup: job.occupationGroup ?? undefined,
            occupationField: job.occupationField ?? undefined,
            experienceRequired: job.experienceRequired,
            drivingLicenseRequired: job.drivingLicenseRequired,
            accessToOwnCar: job.accessToOwnCar,
            applicationDeadline: job.applicationDeadline ?? undefined,
            applicationInstructions: job.applicationInstructions ?? undefined,
            applicationUrl: job.applicationUrl ?? undefined,
            applicationEmail: job.applicationEmail ?? undefined,
            applicationReference: job.applicationReference ?? undefined,
            applicationViaAf: job.applicationViaAf,
            applicationOther: job.applicationOther ?? undefined,
            workplace: job.workplace ?? undefined,
            remote: job.remote,
            streetAddress: job.streetAddress ?? undefined,
            city: job.city ?? undefined,
            municipality: job.municipality ?? undefined,
            municipalityCode: job.municipalityCode ?? undefined,
            region: job.region ?? undefined,
            regionCode: job.regionCode ?? undefined,
            postalCode: job.postalCode ?? undefined,
            country: job.country,
            countryCode: job.countryCode ?? undefined,
            locationFormatted: job.locationFormatted ?? undefined,
            searchText: job.searchText ?? undefined,
            sources: job.sources.map((source) =>
              JobSourceLink.make({
                id: source.id,
                source: source.source as "PLATSBANKEN",
                sourceId: source.sourceId,
                sourceUrl: source.sourceUrl ?? undefined,
                discoveredAt: source.discoveredAt,
              })
            ),
            requirements: job.requirements.map((req) =>
              JobRequirement.make({
                id: req.id,
                requirementType: req.requirementType,
                category: req.category,
                label: req.label,
                weight: req.weight ?? undefined,
              })
            ),
            contacts: job.contacts.map((contact) =>
              JobContact.make({
                id: contact.id,
                name: contact.name ?? undefined,
                role: contact.role ?? undefined,
                email: contact.email ?? undefined,
                phone: contact.phone ?? undefined,
                description: contact.description ?? undefined,
              })
            ),
          });
        });
      });

    const save = (userId: string, jobId: string) =>
      Effect.fn("job.save")(function* () {
        const existing = yield* db.use((client) =>
          client.savedJob.findUnique({
            where: {
              userId_jobId: { userId, jobId },
            },
          })
        );

        if (existing) {
          return true;
        }

        yield* db.use((client) =>
          client.savedJob.create({
            data: {
              userId,
              jobId,
            },
          })
        );

        yield* db.use((client) =>
          client.userJobInteraction.create({
            data: {
              userId,
              jobId,
              action: "SAVE",
            },
          })
        );

        return true;
      });

    const unsave = (userId: string, jobId: string) =>
      Effect.fn("job.unsave")(function* () {
        yield* db.use((client) =>
          client.savedJob.deleteMany({
            where: {
              userId,
              jobId,
            },
          })
        );

        yield* db.use((client) =>
          client.userJobInteraction.create({
            data: {
              userId,
              jobId,
              action: "UNSAVE",
            },
          })
        );

        return true;
      });

    return {
      search,
      getById,
      getSaved,
      save,
      unsave,
    } as const;
  }),
  dependencies: [Database.Default],
}) {}
