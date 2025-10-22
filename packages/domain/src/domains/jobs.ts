import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";

export class JobNotFoundError extends Schema.TaggedError<JobNotFoundError>()(
  "JobNotFoundError",
  {
    jobId: Schema.String,
  },
) {}

export class JobSearchError extends Schema.TaggedError<JobSearchError>()(
  "JobSearchError",
  {
    message: Schema.String,
  },
) {}

export const JobSearchParams = Schema.Struct({
  q: Schema.optional(Schema.String),
  occupation: Schema.optional(Schema.String),
  occupationGroup: Schema.optional(Schema.String),
  occupationField: Schema.optional(Schema.String),
  city: Schema.optional(Schema.String),
  municipality: Schema.optional(Schema.String),
  region: Schema.optional(Schema.String),
  employmentType: Schema.optional(Schema.String),
  workingHoursType: Schema.optional(Schema.String),
  remote: Schema.optional(Schema.Boolean),
  experienceRequired: Schema.optional(Schema.Boolean),
  page: Schema.optional(Schema.Number),
  pageSize: Schema.optional(Schema.Number),
});
export type JobSearchParams = Schema.Schema.Type<typeof JobSearchParams>;

export const Company = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  organizationNumber: Schema.NullOr(Schema.String),
  website: Schema.NullOr(Schema.String),
  logo: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  industry: Schema.NullOr(Schema.String),
  size: Schema.NullOr(Schema.String),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
});
export type Company = Schema.Schema.Type<typeof Company>;

export const JobRequirement = Schema.Struct({
  id: Schema.String,
  jobId: Schema.String,
  requirementType: Schema.String,
  category: Schema.String,
  label: Schema.String,
  weight: Schema.NullOr(Schema.Number),
});
export type JobRequirement = Schema.Schema.Type<typeof JobRequirement>;

export const JobContact = Schema.Struct({
  id: Schema.String,
  jobId: Schema.String,
  name: Schema.NullOr(Schema.String),
  role: Schema.NullOr(Schema.String),
  email: Schema.NullOr(Schema.String),
  phone: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
});
export type JobContact = Schema.Schema.Type<typeof JobContact>;

export const JobSource = Schema.Literal(
  "PLATSBANKEN",
  "LINKEDIN",
  "INDEED",
  "STEPSTONE",
  "GLASSDOOR",
);
export type JobSource = Schema.Schema.Type<typeof JobSource>;

export const JobSourceLink = Schema.Struct({
  id: Schema.String,
  jobId: Schema.String,
  source: JobSource,
  sourceId: Schema.String,
  sourceUrl: Schema.NullOr(Schema.String),
  discoveredAt: Schema.DateTimeUtc,
});
export type JobSourceLink = Schema.Schema.Type<typeof JobSourceLink>;

export const Job = Schema.Struct({
  id: Schema.String,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,

  removed: Schema.Boolean,
  removedAt: Schema.NullOr(Schema.DateTimeUtc),
  publishedAt: Schema.DateTimeUtc,
  lastPublicationDate: Schema.NullOr(Schema.DateTimeUtc),
  expiresAt: Schema.NullOr(Schema.DateTimeUtc),
  lastChecked: Schema.NullOr(Schema.DateTimeUtc),

  title: Schema.String,
  description: Schema.String,
  url: Schema.NullOr(Schema.String),

  companyId: Schema.NullOr(Schema.String),
  company: Schema.NullOr(Company),

  employmentType: Schema.NullOr(Schema.String),
  workingHoursType: Schema.NullOr(Schema.String),
  duration: Schema.NullOr(Schema.String),

  vacancies: Schema.NullOr(Schema.Number),
  startDate: Schema.NullOr(Schema.DateTimeUtc),
  workloadMin: Schema.NullOr(Schema.Number),
  workloadMax: Schema.NullOr(Schema.Number),

  salaryMin: Schema.NullOr(Schema.Number),
  salaryMax: Schema.NullOr(Schema.Number),
  salaryCurrency: Schema.NullOr(Schema.String),
  salaryPeriod: Schema.NullOr(Schema.String),
  salaryType: Schema.NullOr(Schema.String),
  salaryDescription: Schema.NullOr(Schema.String),

  occupation: Schema.NullOr(Schema.String),
  occupationGroup: Schema.NullOr(Schema.String),
  occupationField: Schema.NullOr(Schema.String),

  experienceRequired: Schema.Boolean,
  drivingLicenseRequired: Schema.Boolean,
  accessToOwnCar: Schema.Boolean,

  applicationDeadline: Schema.NullOr(Schema.DateTimeUtc),
  applicationInstructions: Schema.NullOr(Schema.String),
  applicationUrl: Schema.NullOr(Schema.String),
  applicationEmail: Schema.NullOr(Schema.String),
  applicationReference: Schema.NullOr(Schema.String),
  applicationViaAf: Schema.Boolean,
  applicationOther: Schema.NullOr(Schema.String),

  workplace: Schema.NullOr(Schema.String),
  remote: Schema.NullOr(Schema.Boolean),
  streetAddress: Schema.NullOr(Schema.String),
  city: Schema.NullOr(Schema.String),
  municipality: Schema.NullOr(Schema.String),
  municipalityCode: Schema.NullOr(Schema.String),
  region: Schema.NullOr(Schema.String),
  regionCode: Schema.NullOr(Schema.String),
  postalCode: Schema.NullOr(Schema.String),
  country: Schema.String,
  countryCode: Schema.NullOr(Schema.String),
  locationFormatted: Schema.NullOr(Schema.String),

  sources: Schema.Array(JobSourceLink),
  requirements: Schema.Array(JobRequirement),
  contacts: Schema.Array(JobContact),
});
export type Job = Schema.Schema.Type<typeof Job>;

export const JobSearchResult = Schema.Struct({
  jobs: Schema.Array(Job),
  total: Schema.Number,
  page: Schema.Number,
  pageSize: Schema.Number,
});
export type JobSearchResult = Schema.Schema.Type<typeof JobSearchResult>;

export class JobsRpcs extends RpcGroup.make(
  Rpc.make("jobs.search", {
    success: JobSearchResult,
    error: JobSearchError,
    payload: {
      q: Schema.optional(Schema.String),
      occupation: Schema.optional(Schema.String),
      occupationGroup: Schema.optional(Schema.String),
      occupationField: Schema.optional(Schema.String),
      city: Schema.optional(Schema.String),
      municipality: Schema.optional(Schema.String),
      region: Schema.optional(Schema.String),
      employmentType: Schema.optional(Schema.String),
      workingHoursType: Schema.optional(Schema.String),
      remote: Schema.optional(Schema.Boolean),
      experienceRequired: Schema.optional(Schema.Boolean),
      page: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
      pageSize: Schema.optional(
        Schema.Number.pipe(Schema.int(), Schema.positive(), Schema.lessThanOrEqualTo(100)),
      ),
    },
  }),
  Rpc.make("jobs.getById", {
    success: Job,
    error: Schema.Union(JobNotFoundError, JobSearchError),
    payload: {
      id: Schema.String,
    },
  }),
) {}
