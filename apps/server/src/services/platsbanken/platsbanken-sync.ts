import { Database } from "@repo/db";
import {
  Array,
  Console,
  DateTime,
  Duration,
  Effect,
  Layer,
  Option,
  Schedule,
  Schema,
} from "effect";
import { PlatsbankenService } from "./platsbanken";
import {
  PlatsbankenJobTransform,
  type TransformedJob,
} from "./platsbanken-job-transform";

export class PlatsbankenSyncService extends Effect.Service<PlatsbankenSyncService>()(
  "PlatsbankenSyncService",
  {
    dependencies: [PlatsbankenService.Default],
    effect: Effect.gen(function* () {
      const db = yield* Database;
      const platsbankenService = yield* PlatsbankenService;

      const companyData = (company: TransformedJob["company"]) => ({
        name: company.name,
        website: company.website,
        description: company.description,
        logo: company.logo,
      });

      const jobDataForUpdate = (job: TransformedJob, companyId: string) => ({
        removed: job.removed,
        removedAt: job.removedAt,
        lastPublicationDate: job.lastPublicationDate,
        lastChecked: new Date(),
        title: job.title,
        description: job.description,
        url: job.sourceUrl,
        companyId,
        employmentType: job.employmentType,
        workingHoursType: job.workingHoursType,
        duration: job.duration,
        vacancies: job.vacancies,
        startDate: job.startDate ? new Date(job.startDate) : null,
        workloadMin: job.workloadMin,
        workloadMax: job.workloadMax,
        salaryType: job.salaryType,
        salaryDescription: job.salaryDescription,
        occupation: job.occupation,
        occupationGroup: job.occupationGroup,
        occupationField: job.occupationField,
        experienceRequired: job.experienceRequired,
        drivingLicenseRequired: job.drivingLicenseRequired,
        accessToOwnCar: job.accessToOwnCar,
        applicationDeadline: job.applicationDeadline,
        applicationInstructions: job.applicationInstructions,
        applicationUrl: job.applicationUrl,
        applicationEmail: job.applicationEmail,
        applicationReference: job.applicationReference,
        applicationViaAf: job.applicationViaAf,
        applicationOther: job.applicationOther,
        workplace: job.workplace,
        remote: job.remote ?? undefined,
        streetAddress: job.streetAddress,
        city: job.city,
        municipality: job.municipality,
        municipalityCode: job.municipalityCode,
        region: job.region,
        regionCode: job.regionCode,
        postalCode: job.postalCode,
        country: job.country,
        countryCode: job.countryCode,
        locationFormatted: [job.city, job.municipality, job.region]
          .filter(Boolean)
          .join(", "),
      });

      const jobDataForCreate = (job: TransformedJob, companyId: string) => ({
        publishedAt: job.publishedAt,
        lastPublicationDate: job.lastPublicationDate,
        expiresAt: job.expiresAt,
        removed: job.removed,
        removedAt: job.removedAt,
        lastChecked: new Date(),
        title: job.title,
        description: job.description,
        url: job.sourceUrl,
        companyId,
        employmentType: job.employmentType,
        workingHoursType: job.workingHoursType,
        duration: job.duration,
        vacancies: job.vacancies,
        startDate: job.startDate ? new Date(job.startDate) : null,
        workloadMin: job.workloadMin,
        workloadMax: job.workloadMax,
        salaryType: job.salaryType,
        salaryDescription: job.salaryDescription,
        occupation: job.occupation,
        occupationGroup: job.occupationGroup,
        occupationField: job.occupationField,
        experienceRequired: job.experienceRequired,
        drivingLicenseRequired: job.drivingLicenseRequired,
        accessToOwnCar: job.accessToOwnCar,
        applicationDeadline: job.applicationDeadline,
        applicationInstructions: job.applicationInstructions,
        applicationUrl: job.applicationUrl,
        applicationEmail: job.applicationEmail,
        applicationReference: job.applicationReference,
        applicationViaAf: job.applicationViaAf,
        applicationOther: job.applicationOther,
        workplace: job.workplace,
        remote: job.remote ?? undefined,
        streetAddress: job.streetAddress,
        city: job.city,
        municipality: job.municipality,
        municipalityCode: job.municipalityCode,
        region: job.region,
        regionCode: job.regionCode,
        postalCode: job.postalCode,
        country: job.country,
        countryCode: job.countryCode,
        locationFormatted: [job.city, job.municipality, job.region]
          .filter(Boolean)
          .join(", "),
      });

      const coordinatesWKT = (job: TransformedJob) =>
        job.coordinates
          ? `POINT(${job.coordinates[0]} ${job.coordinates[1]})`
          : null;

      const getLastSyncTime = Effect.gen(function* () {
        const lastJobOption = yield* db
          .use((p) =>
            p.job.findFirst({
              where: {
                sources: {
                  some: { source: "PLATSBANKEN" },
                },
                lastChecked: {
                  not: null,
                },
              },
              orderBy: { lastChecked: "desc" },
              select: { lastChecked: true },
            })
          )
          .pipe(Effect.map(Option.fromNullable));

        return lastJobOption.pipe(
          Option.flatMapNullable((job) => job.lastChecked),
          Option.map(DateTime.unsafeFromDate),
          Option.getOrElse(() =>
            DateTime.unsafeNow().pipe(
              DateTime.subtractDuration(Duration.days(7))
            )
          )
        );
      });

      const upsertCompany = (company: TransformedJob["company"]) =>
        Option.match(Option.fromNullable(company.organizationNumber), {
          onSome: (orgNumber) =>
            db.use((p) =>
              p.company.upsert({
                where: { organizationNumber: orgNumber },
                update: companyData(company),
                create: {
                  ...companyData(company),
                  organizationNumber: orgNumber,
                },
              })
            ),
          onNone: () =>
            db.use((p) =>
              p.company.create({
                data: { ...companyData(company) },
              })
            ),
        });

      const updateJobRelations = (jobId: string, job: TransformedJob) =>
        Effect.gen(function* () {
          yield* db.use((p) =>
            p.jobRequirement.deleteMany({ where: { jobId } })
          );

          yield* db.use((p) => p.jobContact.deleteMany({ where: { jobId } }));

          if (job.requirements.length > 0) {
            yield* db.use((p) =>
              p.jobRequirement.createMany({
                data: job.requirements.map((req) => ({
                  jobId,
                  requirementType: req.requirementType,
                  category: req.category,
                  label: req.label,
                  weight: req.weight,
                })),
              })
            );
          }

          if (job.contacts.length > 0) {
            yield* db.use((p) =>
              p.jobContact.createMany({
                data: job.contacts.map((contact) => ({
                  jobId,
                  name: contact.name,
                  role: contact.role,
                  email: contact.email,
                  phone: contact.phone,
                  description: contact.description,
                })),
              })
            );
          }
        });

      const setCoordinates = (jobId: string, job: TransformedJob) => {
        const wkt = coordinatesWKT(job);
        return wkt
          ? db.use((p) =>
              p.$executeRawUnsafe(
                `UPDATE job SET coordinates = ST_GeomFromText('${wkt}', 4326) WHERE id = '${jobId}'`
              )
            )
          : Effect.void;
      };

      const upsertJob = (job: TransformedJob) =>
        Effect.gen(function* () {
          const companyId = (yield* upsertCompany(job.company)).id;

          const existingJobSource = yield* db.use((p) =>
            p.jobSourceLink.findUnique({
              where: {
                source_sourceId: {
                  source: "PLATSBANKEN",
                  sourceId: job.sourceId,
                },
              },
              include: { job: true },
            })
          );

          if (existingJobSource) {
            const updatedJob = yield* db.use((p) =>
              p.job.update({
                where: { id: existingJobSource.job.id },
                data: jobDataForUpdate(job, companyId),
              })
            );

            yield* setCoordinates(updatedJob.id, job);
            yield* updateJobRelations(updatedJob.id, job);

            return updatedJob;
          }

          const newJob = yield* db.use((p) =>
            p.job.create({
              data: {
                ...jobDataForCreate(job, companyId),
                sources: {
                  create: {
                    source: "PLATSBANKEN",
                    sourceId: job.sourceId,
                    sourceUrl: job.sourceUrl,
                  },
                },
              },
            })
          );

          yield* setCoordinates(newJob.id, job);
          yield* updateJobRelations(newJob.id, job);

          return newJob;
        });

      const markJobAsRemoved = (sourceId: string, removedAt: Date | null) =>
        Effect.gen(function* () {
          const existingJobSourceOption = yield* db
            .use((p) =>
              p.jobSourceLink.findUnique({
                where: {
                  source_sourceId: {
                    source: "PLATSBANKEN",
                    sourceId,
                  },
                },
                include: { job: true },
              })
            )
            .pipe(Effect.map(Option.fromNullable));

          return yield* Option.match(existingJobSourceOption, {
            onNone: () => Effect.succeed(Option.none<string>()),
            onSome: (jobSource) =>
              db
                .use((p) =>
                  p.job.update({
                    where: { id: jobSource.job.id },
                    data: {
                      removed: true,
                      removedAt: Option.fromNullable(removedAt).pipe(
                        Option.getOrElse(() => new Date())
                      ),
                      lastChecked: new Date(),
                    },
                  })
                )
                .pipe(Effect.map(() => Option.some(jobSource.job.id))),
          });
        });

      const syncJobs = Effect.gen(function* () {
        const lastSyncTime = yield* getLastSyncTime;

        const jobAds = yield* platsbankenService.stream({
          date: lastSyncTime,
        });

        if (jobAds.length === 0) {
          return { imported: 0, removed: 0, failed: 0 };
        }

        const [activeAds, removedAds] = Array.partition(
          jobAds,
          (ad) => !ad.removed
        );

        const [removedErrors, removedResults] = yield* Effect.partition(
          removedAds,
          (ad) =>
            markJobAsRemoved(
              ad.id,
              ad.removed_date ? new Date(ad.removed_date) : null
            ),
          { concurrency: 10 }
        );

        const removedCount = Array.filter(removedResults, Option.isSome).length;

        if (activeAds.length === 0) {
          yield* Console.log("No active jobs to import");
          return {
            imported: 0,
            removed: removedCount,
            failed: removedErrors.length,
          };
        }

        const [transformErrors, transformedJobs] = yield* Effect.partition(
          activeAds,
          (ad) => Schema.decode(PlatsbankenJobTransform)(ad),
          { concurrency: "unbounded" }
        );

        if (transformedJobs.length === 0) {
          return {
            imported: 0,
            removed: removedCount,
            failed: transformErrors.length + removedErrors.length,
          };
        }

        const [importErrors, importedJobs] = yield* Effect.partition(
          transformedJobs,
          upsertJob,
          { concurrency: 10 }
        );

        const stats = {
          imported: importedJobs.length,
          removed: removedCount,
          failed:
            transformErrors.length + importErrors.length + removedErrors.length,
        };

        yield* Console.log(
          `Sync complete: ${stats.imported} imported, ${stats.removed} removed, ${stats.failed} failed`
        );

        return stats;
      });

      const startScheduler = Effect.asVoid(
        syncJobs.pipe(
          Effect.catchAll((error) =>
            Console.error(`Sync failed: ${error}`).pipe(
              Effect.as({ imported: 0, removed: 0, failed: 0 })
            )
          ),
          Effect.repeat(Schedule.fixed("1 hour"))
        )
      );

      return {
        startScheduler,
      };
    }),
  }
) {}

export const PlatsbankenSyncSchedulerLayer = Layer.effectDiscard(
  PlatsbankenSyncService.pipe(
    Effect.flatMap((service) => service.startScheduler)
  )
).pipe(
  Layer.provide(PlatsbankenSyncService.Default),
  Layer.provide(Database.Live)
);
