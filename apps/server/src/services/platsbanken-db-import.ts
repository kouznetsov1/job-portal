import { Effect, Console } from "effect";
import { Database } from "@repo/db";
import type { TransformedJob } from "./platsbanken-job-transform";

export class PlatsbankenDbImportService extends Effect.Service<PlatsbankenDbImportService>()(
  "PlatsbankenDbImportService",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database;
      const prisma = db.client;

      const upsertJob = (transformedJob: TransformedJob) =>
        Effect.gen(function* () {
          let company;

          if (transformedJob.company.organizationNumber) {
            company = yield* Effect.tryPromise({
              try: () =>
                prisma.company.upsert({
                  where: {
                    organizationNumber: transformedJob.company.organizationNumber!,
                  },
                  update: {
                    name: transformedJob.company.name,
                    website: transformedJob.company.website,
                    description: transformedJob.company.description,
                  },
                  create: {
                    name: transformedJob.company.name,
                    organizationNumber: transformedJob.company.organizationNumber,
                    website: transformedJob.company.website,
                    description: transformedJob.company.description,
                  },
                }),
              catch: (error) => new Error(`Could not upsert company: ${error}`),
            });
          } else {
            company = yield* Effect.tryPromise({
              try: () =>
                prisma.company.create({
                  data: {
                    name: transformedJob.company.name,
                    organizationNumber: null,
                    website: transformedJob.company.website,
                    description: transformedJob.company.description,
                  },
                }),
              catch: (error) => new Error(`Could not create company: ${error}`),
            });
          }

          const companyId = company.id;

          const existingJobSource = yield* Effect.tryPromise({
            try: () =>
              prisma.jobSourceLink.findUnique({
                where: {
                  source_sourceId: {
                    source: "PLATSBANKEN",
                    sourceId: transformedJob.sourceId,
                  },
                },
                include: { job: true },
              }),
            catch: (error) => new Error(`Could not find existing job: ${error}`),
          });

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
            const updatedJob = yield* Effect.tryPromise({
              try: () =>
                prisma.job.update({
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
              catch: (error) => new Error(`Could not update job: ${error}`),
            });

            if (coordinatesWKT) {
              yield* Effect.tryPromise({
                try: () =>
                  prisma.$executeRawUnsafe(
                    `UPDATE job SET coordinates = ST_GeomFromText('${coordinatesWKT}', 4326) WHERE id = '${updatedJob.id}'`,
                  ),
                catch: (error) =>
                  new Error(`Could not update coordinates: ${error}`),
              });
            }

            yield* Effect.tryPromise({
              try: () =>
                prisma.jobRequirement.deleteMany({
                  where: { jobId: updatedJob.id },
                }),
              catch: (error) => new Error(`Could not delete requirements: ${error}`),
            });

            yield* Effect.tryPromise({
              try: () =>
                prisma.jobContact.deleteMany({
                  where: { jobId: updatedJob.id },
                }),
              catch: (error) => new Error(`Could not delete contacts: ${error}`),
            });

            return updatedJob;
          }

          const newJob = yield* Effect.tryPromise({
            try: () =>
              prisma.job.create({
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
            catch: (error) => new Error(`Could not create job: ${error}`),
          });

          if (coordinatesWKT) {
            yield* Effect.tryPromise({
              try: () =>
                prisma.$executeRawUnsafe(
                  `UPDATE job SET coordinates = ST_GeomFromText('${coordinatesWKT}', 4326) WHERE id = '${newJob.id}'`,
                ),
              catch: (error) => new Error(`Could not update coordinates: ${error}`),
            });
          }

          if (transformedJob.requirements.length > 0) {
            yield* Effect.tryPromise({
              try: () =>
                prisma.jobRequirement.createMany({
                  data: transformedJob.requirements.map((req) => ({
                    jobId: newJob.id,
                    requirementType: req.requirementType,
                    category: req.category,
                    label: req.label,
                    weight: req.weight,
                  })),
                }),
              catch: (error) => new Error(`Could not create requirements: ${error}`),
            });
          }

          if (transformedJob.contacts.length > 0) {
            yield* Effect.tryPromise({
              try: () =>
                prisma.jobContact.createMany({
                  data: transformedJob.contacts.map((contact) => ({
                    jobId: newJob.id,
                    name: contact.name,
                    role: contact.role,
                    email: contact.email,
                    phone: contact.phone,
                    description: contact.description,
                  })),
                }),
              catch: (error) => new Error(`Could not create contacts: ${error}`),
            });
          }

          return newJob;
        });

      const importJobs = (transformedJobs: TransformedJob[]) =>
        Effect.gen(function* () {
          yield* Console.log(
            `Importerar ${transformedJobs.length} jobb till databasen...`,
          );

          let successCount = 0;
          let errorCount = 0;

          for (const job of transformedJobs) {
            const result = yield* Effect.either(upsertJob(job));

            if (result._tag === "Right") {
              successCount++;
              if (successCount % 100 === 0) {
                yield* Console.log(
                  `Framsteg: ${successCount}/${transformedJobs.length} jobb importerade`,
                );
              }
            } else {
              errorCount++;
              yield* Console.error(
                `Fel vid import av jobb ${job.sourceId}: ${result.left.message}`,
              );
            }
          }

          yield* Console.log(
            `✅ Import klar: ${successCount} lyckades, ${errorCount} misslyckades`,
          );

          return { successCount, errorCount };
        });

      return { upsertJob, importJobs };
    }),
  },
) {}
