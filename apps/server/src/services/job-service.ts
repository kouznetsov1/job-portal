import { Effect, DateTime } from "effect";
import { Database } from "@repo/db";
import {
  Job,
  JobSearchResult,
  Company,
  JobId,
  CompanyId,
  JobRequirementId,
  JobContactId,
  JobSourceLinkId,
} from "@repo/domain";

export interface JobSearchParams {
  readonly q?: string;
  readonly occupation?: string;
  readonly occupationGroup?: string;
  readonly occupationField?: string;
  readonly city?: string;
  readonly municipality?: string;
  readonly region?: string;
  readonly employmentType?: string;
  readonly workingHoursType?: string;
  readonly remote?: boolean;
  readonly experienceRequired?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
}

const transformDate = (date: Date | null): DateTime.Utc | null =>
  date ? DateTime.unsafeFromDate(date) : null;

export class JobService extends Effect.Service<JobService>()("JobService", {
  scoped: Effect.gen(function* () {
    const db = yield* Database;

    const search = (params: JobSearchParams) =>
      Effect.gen(function* () {
        const page = params.page ?? 1;
        const pageSize = params.pageSize ?? 20;
        const skip = (page - 1) * pageSize;

        const where: Record<string, unknown> = {
          removed: false,
        };

        if (params.q) {
          where["OR"] = [
            { title: { contains: params.q, mode: "insensitive" } },
            { description: { contains: params.q, mode: "insensitive" } },
            { company: { name: { contains: params.q, mode: "insensitive" } } },
          ];
        }

        if (params.occupation) {
          where["occupation"] = {
            contains: params.occupation,
            mode: "insensitive",
          };
        }

        if (params.occupationGroup) {
          where["occupationGroup"] = {
            contains: params.occupationGroup,
            mode: "insensitive",
          };
        }

        if (params.occupationField) {
          where["occupationField"] = {
            contains: params.occupationField,
            mode: "insensitive",
          };
        }

        if (params.city) {
          where["city"] = { contains: params.city, mode: "insensitive" };
        }

        if (params.municipality) {
          where["municipality"] = {
            contains: params.municipality,
            mode: "insensitive",
          };
        }

        if (params.region) {
          where["region"] = { contains: params.region, mode: "insensitive" };
        }

        if (params.employmentType) {
          where["employmentType"] = {
            contains: params.employmentType,
            mode: "insensitive",
          };
        }

        if (params.workingHoursType) {
          where["workingHoursType"] = {
            contains: params.workingHoursType,
            mode: "insensitive",
          };
        }

        if (params.remote !== undefined) {
          where["remote"] = params.remote;
        }

        if (params.experienceRequired !== undefined) {
          where["experienceRequired"] = params.experienceRequired;
        }

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

        const jobs = rawJobs.map((job) => ({
          ...job,
          id: JobId.make(job.id),
          createdAt: DateTime.unsafeFromDate(job.createdAt),
          updatedAt: DateTime.unsafeFromDate(job.updatedAt),
          publishedAt: DateTime.unsafeFromDate(job.publishedAt),
          removedAt: transformDate(job.removedAt),
          lastPublicationDate: transformDate(job.lastPublicationDate),
          expiresAt: transformDate(job.expiresAt),
          lastChecked: transformDate(job.lastChecked),
          startDate: transformDate(job.startDate),
          applicationDeadline: transformDate(job.applicationDeadline),
          companyId: job.companyId ? CompanyId.make(job.companyId) : null,
          company: job.company
            ? {
                id: CompanyId.make(job.company.id),
                name: job.company.name,
                organizationNumber: job.company.organizationNumber,
                website: job.company.website,
                logo: job.company.logo,
                description: job.company.description,
                industry: job.company.industry,
                size: job.company.size,
                createdAt: DateTime.unsafeFromDate(job.company.createdAt),
                updatedAt: DateTime.unsafeFromDate(job.company.updatedAt),
              }
            : null,
          sources: job.sources.map((source) => ({
            id: JobSourceLinkId.make(source.id),
            jobId: JobId.make(source.jobId),
            source: source.source,
            sourceId: source.sourceId,
            sourceUrl: source.sourceUrl,
            discoveredAt: DateTime.unsafeFromDate(source.discoveredAt),
          })),
          requirements: job.requirements.map((req) => ({
            id: JobRequirementId.make(req.id),
            jobId: JobId.make(req.jobId),
            requirementType: req.requirementType,
            category: req.category,
            label: req.label,
            weight: req.weight,
          })),
          contacts: job.contacts.map((contact) => ({
            id: JobContactId.make(contact.id),
            jobId: JobId.make(contact.jobId),
            name: contact.name,
            role: contact.role,
            email: contact.email,
            phone: contact.phone,
            description: contact.description,
          })),
        }));

        return {
          jobs,
          total,
          page,
          pageSize,
        };
      }).pipe(Effect.mapError((error) => String(error)));

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
          return yield* Effect.fail(`Job inte hittad: ${id}`);
        }

        return {
          ...rawJob,
          id: JobId.make(rawJob.id),
          createdAt: DateTime.unsafeFromDate(rawJob.createdAt),
          updatedAt: DateTime.unsafeFromDate(rawJob.updatedAt),
          publishedAt: DateTime.unsafeFromDate(rawJob.publishedAt),
          removedAt: transformDate(rawJob.removedAt),
          lastPublicationDate: transformDate(rawJob.lastPublicationDate),
          expiresAt: transformDate(rawJob.expiresAt),
          lastChecked: transformDate(rawJob.lastChecked),
          startDate: transformDate(rawJob.startDate),
          applicationDeadline: transformDate(rawJob.applicationDeadline),
          companyId: rawJob.companyId ? CompanyId.make(rawJob.companyId) : null,
          company: rawJob.company
            ? {
                id: CompanyId.make(rawJob.company.id),
                name: rawJob.company.name,
                organizationNumber: rawJob.company.organizationNumber,
                website: rawJob.company.website,
                logo: rawJob.company.logo,
                description: rawJob.company.description,
                industry: rawJob.company.industry,
                size: rawJob.company.size,
                createdAt: DateTime.unsafeFromDate(rawJob.company.createdAt),
                updatedAt: DateTime.unsafeFromDate(rawJob.company.updatedAt),
              }
            : null,
          sources: rawJob.sources.map((source) => ({
            id: JobSourceLinkId.make(source.id),
            jobId: JobId.make(source.jobId),
            source: source.source,
            sourceId: source.sourceId,
            sourceUrl: source.sourceUrl,
            discoveredAt: DateTime.unsafeFromDate(source.discoveredAt),
          })),
          requirements: rawJob.requirements.map((req) => ({
            id: JobRequirementId.make(req.id),
            jobId: JobId.make(req.jobId),
            requirementType: req.requirementType,
            category: req.category,
            label: req.label,
            weight: req.weight,
          })),
          contacts: rawJob.contacts.map((contact) => ({
            id: JobContactId.make(contact.id),
            jobId: JobId.make(contact.jobId),
            name: contact.name,
            role: contact.role,
            email: contact.email,
            phone: contact.phone,
            description: contact.description,
          })),
        };
      }).pipe(Effect.mapError((error) => String(error)));

    return { search, getById };
  }),
}) {}
