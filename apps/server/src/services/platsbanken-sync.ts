import { Effect, Console, DateTime, Duration, Schema } from "effect";
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
        const lastJob = yield* db.use((p) =>
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
        );

        if (lastJob?.lastChecked) {
          const lastSyncDate = DateTime.unsafeFromDate(lastJob.lastChecked);
          yield* Console.log(`Last sync: ${DateTime.formatIso(lastSyncDate)}`);
          return lastSyncDate;
        }

        const defaultStartDate = DateTime.unsafeNow().pipe(
          DateTime.subtractDuration(Duration.days(7)),
        );
        yield* Console.log(
          `No previous sync found, using 7 days ago: ${DateTime.formatIso(defaultStartDate)}`,
        );
        return defaultStartDate;
      });

      const upsertJob = (transformedJob: TransformedJob) =>
        Effect.gen(function* () {
          let company;

          if (transformedJob.company.organizationNumber) {
            company = yield* db.use((p) =>
              p.company.upsert({
                where: {
                  organizationNumber:
                    transformedJob.company.organizationNumber!,
                },
                update: {
                  name: transformedJob.company.name,
                  website: transformedJob.company.website,
                  description: transformedJob.company.description,
                },
                create: {
                  name: transformedJob.company.name,
                  organizationNumber:
                    transformedJob.company.organizationNumber,
                  website: transformedJob.company.website,
                  description: transformedJob.company.description,
                },
              }),
            );
          } else {
            company = yield* db.use((p) =>
              p.company.create({
                data: {
                  name: transformedJob.company.name,
                  organizationNumber: null,
                  website: transformedJob.company.website,
                  description: transformedJob.company.description,
                },
              }),
            );
          }

          const companyId = company.id;

          const existingJobSource = yield* db.use((p) =>
            p.jobSourceLink.findUnique({
              where: {
                source_sourceId: {
                  source: "PLATSBANKEN",
                  sourceId: transformedJob.sourceId,
                },
              },
              include: { job: true },
            }),
          );

          const locationFormatted = [
            transformedJob.city,
            transformedJob.municipality,
            transformedJob.region,
          ]
            .filter(Boolean)
            .join(", ");

          const coordinatesWKT = transformedJob.coordinates
            ? `POINT(${transformedJob.coordinates[0]} ${transformedJob.coordinates[1]})`
            : null;

          if (existingJobSource) {
            const updatedJob = yield* db.use((p) =>
              p.job.update({
                where: { id: existingJobSource.job.id },
                data: {
                  removed: transformedJob.removed,
                  removedAt: transformedJob.removedAt,
                  lastPublicationDate: transformedJob.lastPublicationDate,
                  lastChecked: new Date(),

                  title: transformedJob.title,
                  description: transformedJob.description,
                  url: transformedJob.sourceUrl,
                  companyId,

                  employmentType: transformedJob.employmentType,
                  workingHoursType: transformedJob.workingHoursType,
                  duration: transformedJob.duration,

                  vacancies: transformedJob.vacancies,
                  startDate: transformedJob.startDate
                    ? new Date(transformedJob.startDate)
                    : null,
                  workloadMin: transformedJob.workloadMin,
                  workloadMax: transformedJob.workloadMax,

                  salaryType: transformedJob.salaryType,
                  salaryDescription: transformedJob.salaryDescription,

                  occupation: transformedJob.occupation,
                  occupationGroup: transformedJob.occupationGroup,
                  occupationField: transformedJob.occupationField,

                  experienceRequired: transformedJob.experienceRequired,
                  drivingLicenseRequired:
                    transformedJob.drivingLicenseRequired,
                  accessToOwnCar: transformedJob.accessToOwnCar,

                  applicationDeadline: transformedJob.applicationDeadline,
                  applicationInstructions:
                    transformedJob.applicationInstructions,
                  applicationUrl: transformedJob.applicationUrl,
                  applicationEmail: transformedJob.applicationEmail,
                  applicationReference: transformedJob.applicationReference,
                  applicationViaAf: transformedJob.applicationViaAf,
                  applicationOther: transformedJob.applicationOther,

                  workplace: transformedJob.workplace,
                  remote: transformedJob.remote,
                  streetAddress: transformedJob.streetAddress,
                  city: transformedJob.city,
                  municipality: transformedJob.municipality,
                  municipalityCode: transformedJob.municipalityCode,
                  region: transformedJob.region,
                  regionCode: transformedJob.regionCode,
                  postalCode: transformedJob.postalCode,
                  country: transformedJob.country,
                  countryCode: transformedJob.countryCode,
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

            return updatedJob;
          }

          const newJob = yield* db.use((p) =>
            p.job.create({
              data: {
                publishedAt: transformedJob.publishedAt,
                lastPublicationDate: transformedJob.lastPublicationDate,
                expiresAt: transformedJob.expiresAt,
                removed: transformedJob.removed,
                removedAt: transformedJob.removedAt,
                lastChecked: new Date(),

                title: transformedJob.title,
                description: transformedJob.description,
                url: transformedJob.sourceUrl,
                companyId,

                employmentType: transformedJob.employmentType,
                workingHoursType: transformedJob.workingHoursType,
                duration: transformedJob.duration,

                vacancies: transformedJob.vacancies,
                startDate: transformedJob.startDate
                  ? new Date(transformedJob.startDate)
                  : null,
                workloadMin: transformedJob.workloadMin,
                workloadMax: transformedJob.workloadMax,

                salaryType: transformedJob.salaryType,
                salaryDescription: transformedJob.salaryDescription,

                occupation: transformedJob.occupation,
                occupationGroup: transformedJob.occupationGroup,
                occupationField: transformedJob.occupationField,

                experienceRequired: transformedJob.experienceRequired,
                drivingLicenseRequired: transformedJob.drivingLicenseRequired,
                accessToOwnCar: transformedJob.accessToOwnCar,

                applicationDeadline: transformedJob.applicationDeadline,
                applicationInstructions:
                  transformedJob.applicationInstructions,
                applicationUrl: transformedJob.applicationUrl,
                applicationEmail: transformedJob.applicationEmail,
                applicationReference: transformedJob.applicationReference,
                applicationViaAf: transformedJob.applicationViaAf,
                applicationOther: transformedJob.applicationOther,

                workplace: transformedJob.workplace,
                remote: transformedJob.remote,
                streetAddress: transformedJob.streetAddress,
                city: transformedJob.city,
                municipality: transformedJob.municipality,
                municipalityCode: transformedJob.municipalityCode,
                region: transformedJob.region,
                regionCode: transformedJob.regionCode,
                postalCode: transformedJob.postalCode,
                country: transformedJob.country,
                countryCode: transformedJob.countryCode,
                locationFormatted,

                sources: {
                  create: {
                    source: "PLATSBANKEN",
                    sourceId: transformedJob.sourceId,
                    sourceUrl: transformedJob.sourceUrl,
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

          if (transformedJob.requirements.length > 0) {
            yield* db.use((p) =>
              p.jobRequirement.createMany({
                data: transformedJob.requirements.map((req) => ({
                  jobId: newJob.id,
                  requirementType: req.requirementType,
                  category: req.category,
                  label: req.label,
                  weight: req.weight,
                })),
              }),
            );
          }

          if (transformedJob.contacts.length > 0) {
            yield* db.use((p) =>
              p.jobContact.createMany({
                data: transformedJob.contacts.map((contact) => ({
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
          const existingJobSource = yield* db.use((p) =>
            p.jobSourceLink.findUnique({
              where: {
                source_sourceId: {
                  source: "PLATSBANKEN",
                  sourceId,
                },
              },
              include: { job: true },
            }),
          );

          if (!existingJobSource) {
            return null;
          }

          yield* db.use((p) =>
            p.job.update({
              where: { id: existingJobSource.job.id },
              data: {
                removed: true,
                removedAt: removedAt || new Date(),
                lastChecked: new Date(),
              },
            }),
          );

          return existingJobSource.job.id;
        });

      const syncJobs = Effect.gen(function* () {
        yield* Console.log("Starting hourly job sync from Platsbanken...");

        const lastSyncTime = yield* getLastSyncTime;

        const jobAds = yield* platsbankenService.stream({
          date: lastSyncTime,
        });

        if (jobAds.length === 0) {
          yield* Console.log("No new jobs to sync");
          return { imported: 0, removed: 0, failed: 0 };
        }

        const activeAds = jobAds.filter((ad) => !ad.removed);
        const removedAds = jobAds.filter((ad) => ad.removed);

        yield* Console.log(
          `Processing ${activeAds.length} active jobs and ${removedAds.length} removed jobs...`,
        );

        let removedCount = 0;
        for (const removedAd of removedAds) {
          const result = yield* Effect.either(
            markJobAsRemoved(
              removedAd.id,
              removedAd.removed_date ? new Date(removedAd.removed_date) : null,
            ),
          );

          if (result._tag === "Right" && result.right !== null) {
            removedCount++;
          }
        }

        yield* Console.log(`Marked ${removedCount} jobs as removed`);

        if (activeAds.length === 0) {
          yield* Console.log("No active jobs to import");
          return { imported: 0, removed: removedCount, failed: 0 };
        }

        yield* Console.log(`Transforming ${activeAds.length} active jobs...`);

        const transformedJobs = [];
        let transformErrors = 0;

        for (const jobAd of activeAds) {
          const result = yield* Effect.either(
            Schema.decode(PlatsbankenJobTransform)(jobAd),
          );

          if (result._tag === "Right") {
            transformedJobs.push(result.right);
          } else {
            transformErrors++;
            yield* Console.error(
              `Failed to transform job ${jobAd.id}: ${result.left.message}`,
            );
          }
        }

        yield* Console.log(
          `Transformed ${transformedJobs.length} jobs (${transformErrors} errors)`,
        );

        if (transformedJobs.length === 0) {
          yield* Console.log("No jobs to import after transformation");
          return {
            imported: 0,
            removed: removedCount,
            failed: transformErrors,
          };
        }

        yield* Console.log(
          `Importing ${transformedJobs.length} jobs to database...`,
        );

        let successCount = 0;
        let errorCount = 0;

        for (const job of transformedJobs) {
          const result = yield* Effect.either(upsertJob(job));

          if (result._tag === "Right") {
            successCount++;
            if (successCount % 100 === 0) {
              yield* Console.log(
                `Progress: ${successCount}/${transformedJobs.length} jobs imported`,
              );
            }
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
