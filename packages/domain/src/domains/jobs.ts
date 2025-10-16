import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";

export const JobId = Schema.String.pipe(Schema.brand("JobId"));
export type JobId = Schema.Schema.Type<typeof JobId>;

export const CompanyId = Schema.String.pipe(Schema.brand("CompanyId"));
export type CompanyId = Schema.Schema.Type<typeof CompanyId>;

export const UserId = Schema.String.pipe(Schema.brand("UserId"));
export type UserId = Schema.Schema.Type<typeof UserId>;

export const JobRequirementId = Schema.String.pipe(Schema.brand("JobRequirementId"));
export type JobRequirementId = Schema.Schema.Type<typeof JobRequirementId>;

export const JobContactId = Schema.String.pipe(Schema.brand("JobContactId"));
export type JobContactId = Schema.Schema.Type<typeof JobContactId>;

export const JobSourceLinkId = Schema.String.pipe(Schema.brand("JobSourceLinkId"));
export type JobSourceLinkId = Schema.Schema.Type<typeof JobSourceLinkId>;

export const Company = Schema.Struct({
  id: CompanyId,
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
  id: JobRequirementId,
  jobId: JobId,
  requirementType: Schema.String,
  category: Schema.String,
  label: Schema.String,
  weight: Schema.NullOr(Schema.Number),
});
export type JobRequirement = Schema.Schema.Type<typeof JobRequirement>;

export const JobContact = Schema.Struct({
  id: JobContactId,
  jobId: JobId,
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
  id: JobSourceLinkId,
  jobId: JobId,
  source: JobSource,
  sourceId: Schema.String,
  sourceUrl: Schema.NullOr(Schema.String),
  discoveredAt: Schema.DateTimeUtc,
});
export type JobSourceLink = Schema.Schema.Type<typeof JobSourceLink>;

export const Job = Schema.Struct({
  id: JobId,
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

  companyId: Schema.NullOr(CompanyId),
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
  remote: Schema.Boolean,
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
    error: Schema.String,
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
    error: Schema.String,
    payload: {
      id: JobId,
    },
  }),
) {}
