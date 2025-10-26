import { Effect, Console, DateTime, Duration, Schema, Option } from "effect";
import { Database } from "@repo/db";
import { PlatsbankenService } from "../integrations/platsbanken";
import {
  PlatsbankenJobTransform,
  type TransformedJob,
} from "./platsbanken-job-transform";

export class PlatsbankenSyncService extends Effect.Service<PlatsbankenSyncService>()(
  "PlatsbankenSyncService",
  {
    scoped: Effect.gen(function* () {
      const db = yield* Database;
      const platsbankenService = yield* PlatsbankenService;

      const getLastSyncTime = Effect.gen(function* () {
        const lastJobOption = yield* db.use((p) =>
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
          }),
        ).pipe(Effect.map(Option.fromNullable));

        return lastJobOption.pipe(
          Option.flatMapNullable((job) => job.lastChecked),
          Option.map(DateTime.unsafeFromDate),
          Option.getOrElse(() =>
            DateTime.unsafeNow().pipe(DateTime.subtractDuration(Duration.days(7))),
          ),
        );
      });

      const upsertJob = (job: TransformedJob) =>
        Effect.gen(function* () {
          const orgNumberOption = Option.fromNullable(
            job.company.organizationNumber,
          );

          const company = yield* Option.match(orgNumberOption, {
            onSome: (orgNumber) =>
              db.use((p) =>
                p.company.upsert({
                  where: {
                    organizationNumber: orgNumber,
                  },
                  update: {
                    name: job.company.name,
                    website: job.company.website,
                    description: job.company.description,
                    logo: job.company.logo,
                  },
                  create: {
                    name: job.company.name,
                    organizationNumber: orgNumber,
                    website: job.company.website,
                    description: job.company.description,
                    logo: job.company.logo,
                  },
                }),
              ),
            onNone: () =>
              db.use((p) =>
                p.company.create({
                  data: {
                    name: job.company.name,
                    organizationNumber: null,
                    website: job.company.website,
                    description: job.company.description,
                    logo: job.company.logo,
                  },
                }),
              ),
          });

          const companyId = company.id;

          const existingJobSource = yield* db.use((p) =>
            p.jobSourceLink.findUnique({
              where: {
                source_sourceId: {
                  source: "PLATSBANKEN",
                  sourceId: job.sourceId,
                },
              },
              include: { job: true },
            }),
          );

          const locationFormatted = [job.city, job.municipality, job.region]
            .filter(Boolean)
            .join(", ");

          const coordinatesWKT = job.coordinates
            ? `POINT(${job.coordinates[0]} ${job.coordinates[1]})`
            : null;

          if (existingJobSource) {
            const updatedJob = yield* db.use((p) =>
              p.job.update({
                where: { id: existingJobSource.job.id },
                data: {
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
                  locationFormatted,
                },
              }),
            );

            if (coordinatesWKT) {
              yield* db.use((p) =>
                p.$executeRawUnsafe(
                  `UPDATE job SET coordinates = ST_GeomFromText('${coordinatesWKT}', 4326) WHERE id = '${updatedJob.id}'`,
                ),
              );
            }

            yield* db.use((p) =>
              p.jobRequirement.deleteMany({
                where: { jobId: updatedJob.id },
              }),
            );

            yield* db.use((p) =>
              p.jobContact.deleteMany({
                where: { jobId: updatedJob.id },
              }),
            );

            if (job.requirements.length > 0) {
              yield* db.use((p) =>
                p.jobRequirement.createMany({
                  data: job.requirements.map((req) => ({
                    jobId: updatedJob.id,
                    requirementType: req.requirementType,
                    category: req.category,
                    label: req.label,
                    weight: req.weight,
                  })),
                }),
              );
            }

            if (job.contacts.length > 0) {
              yield* db.use((p) =>
                p.jobContact.createMany({
                  data: job.contacts.map((contact) => ({
                    jobId: updatedJob.id,
                    name: contact.name,
                    role: contact.role,
                    email: contact.email,
                    phone: contact.phone,
                    description: contact.description,
                  })),
                }),
              );
            }

            return updatedJob;
          }

          const newJob = yield* db.use((p) =>
            p.job.create({
              data: {
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
                locationFormatted,

                sources: {
                  create: {
                    source: "PLATSBANKEN",
                    sourceId: job.sourceId,
                    sourceUrl: job.sourceUrl,
                  },
                },
              },
            }),
          );

          if (coordinatesWKT) {
            yield* db.use((p) =>
              p.$executeRawUnsafe(
                `UPDATE job SET coordinates = ST_GeomFromText('${coordinatesWKT}', 4326) WHERE id = '${newJob.id}'`,
              ),
            );
          }

          if (job.requirements.length > 0) {
            yield* db.use((p) =>
              p.jobRequirement.createMany({
                data: job.requirements.map((req) => ({
                  jobId: newJob.id,
                  requirementType: req.requirementType,
                  category: req.category,
                  label: req.label,
                  weight: req.weight,
                })),
              }),
            );
          }

          if (job.contacts.length > 0) {
            yield* db.use((p) =>
              p.jobContact.createMany({
                data: job.contacts.map((contact) => ({
                  jobId: newJob.id,
                  name: contact.name,
                  role: contact.role,
                  email: contact.email,
                  phone: contact.phone,
                  description: contact.description,
                })),
              }),
            );
          }

          return newJob;
        });

      const markJobAsRemoved = (sourceId: string, removedAt: Date | null) =>
        Effect.gen(function* () {
          const existingJobSourceOption = yield* db.use((p) =>
            p.jobSourceLink.findUnique({
              where: {
                source_sourceId: {
                  source: "PLATSBANKEN",
                  sourceId,
                },
              },
              include: { job: true },
            }),
          ).pipe(Effect.map(Option.fromNullable));

          return yield* Option.match(existingJobSourceOption, {
            onNone: () => Effect.succeed(Option.none<string>()),
            onSome: (jobSource) =>
              db.use((p) =>
                p.job.update({
                  where: { id: jobSource.job.id },
                  data: {
                    removed: true,
                    removedAt: Option.fromNullable(removedAt).pipe(
                      Option.getOrElse(() => new Date()),
                    ),
                    lastChecked: new Date(),
                  },
                }),
              ).pipe(Effect.map(() => Option.some(jobSource.job.id))),
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

        const activeAds = jobAds.filter((ad) => !ad.removed);
        const removedAds = jobAds.filter((ad) => ad.removed);

        let removedCount = 0;
        for (const removedAd of removedAds) {
          const result = yield* Effect.either(
            markJobAsRemoved(
              removedAd.id,
              removedAd.removed_date ? new Date(removedAd.removed_date) : null,
            ),
          );

          if (result._tag === "Right" && Option.isSome(result.right)) {
            removedCount++;
          }
        }

        if (activeAds.length === 0) {
          yield* Console.log("No active jobs to import");
          return { imported: 0, removed: removedCount, failed: 0 };
        }

        const jobs: TransformedJob[] = [];
        let transformErrors = 0;

        for (const jobAd of activeAds) {
          const result = yield* Effect.either(
            Schema.decode(PlatsbankenJobTransform)(jobAd),
          );

          if (result._tag === "Right") {
            jobs.push(result.right);
          } else {
            transformErrors++;
            yield* Console.error(
              `Failed to transform job ${jobAd.id}: ${result.left.message}`,
            );
          }
        }

        if (jobs.length === 0) {
          return {
            imported: 0,
            removed: removedCount,
            failed: transformErrors,
          };
        }

        let successCount = 0;
        let errorCount = 0;

        for (const job of jobs) {
          const result = yield* Effect.either(upsertJob(job));

          if (result._tag === "Right") {
            successCount++;
          } else {
            errorCount++;
            yield* Console.error(
              `Failed to import job ${job.sourceId}: ${result.left.message}`,
            );
          }
        }

        yield* Console.log(
          `Sync complete: ${successCount} imported, ${removedCount} removed, ${errorCount + transformErrors} failed`,
        );

        return {
          imported: successCount,
          removed: removedCount,
          failed: errorCount + transformErrors,
        };
      });

      return { syncJobs };
    }),
  },
) {}
