import { Schema } from "effect";
import { CompanyId } from "./company";
import { DatabaseError } from "./database";

export const JobId = Schema.String.pipe(Schema.brand("JobId"));

export const JobSource = Schema.Literal("PLATSBANKEN");

export class JobSourceLink extends Schema.Class<JobSourceLink>("JobSourceLink")(
  {
    id: Schema.String,
    source: JobSource,
    sourceId: Schema.String,
    sourceUrl: Schema.optional(Schema.String),
    discoveredAt: Schema.Date,
  }
) {}

export class JobRequirement extends Schema.Class<JobRequirement>(
  "JobRequirement"
)({
  id: Schema.String,
  requirementType: Schema.String,
  category: Schema.String,
  label: Schema.String,
  weight: Schema.optional(Schema.Number),
}) {}

export class JobContact extends Schema.Class<JobContact>("JobContact")({
  id: Schema.String,
  name: Schema.optional(Schema.String),
  role: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  phone: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
}) {}

export class Job extends Schema.Class<Job>("Job")({
  id: JobId,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,

  removed: Schema.Boolean,
  removedAt: Schema.optional(Schema.Date),
  publishedAt: Schema.Date,
  lastPublicationDate: Schema.optional(Schema.Date),
  expiresAt: Schema.optional(Schema.Date),
  lastChecked: Schema.optional(Schema.Date),

  title: Schema.String,
  description: Schema.String,
  url: Schema.optional(Schema.String),

  companyId: CompanyId,

  employmentType: Schema.optional(Schema.String),
  workingHoursType: Schema.optional(Schema.String),
  duration: Schema.optional(Schema.String),

  vacancies: Schema.optional(Schema.Number),
  startDate: Schema.optional(Schema.Date),
  workloadMin: Schema.optional(Schema.Number),
  workloadMax: Schema.optional(Schema.Number),

  salaryMin: Schema.optional(Schema.Number),
  salaryMax: Schema.optional(Schema.Number),
  salaryCurrency: Schema.optional(Schema.String),
  salaryPeriod: Schema.optional(Schema.String),
  salaryType: Schema.optional(Schema.String),
  salaryDescription: Schema.optional(Schema.String),

  occupation: Schema.optional(Schema.String),
  occupationGroup: Schema.optional(Schema.String),
  occupationField: Schema.optional(Schema.String),

  experienceRequired: Schema.Boolean,
  drivingLicenseRequired: Schema.Boolean,
  accessToOwnCar: Schema.Boolean,

  applicationDeadline: Schema.optional(Schema.Date),
  applicationInstructions: Schema.optional(Schema.String),
  applicationUrl: Schema.optional(Schema.String),
  applicationEmail: Schema.optional(Schema.String),
  applicationReference: Schema.optional(Schema.String),
  applicationViaAf: Schema.Boolean,
  applicationOther: Schema.optional(Schema.String),

  workplace: Schema.optional(Schema.String),
  remote: Schema.Boolean,
  streetAddress: Schema.optional(Schema.String),
  city: Schema.optional(Schema.String),
  municipality: Schema.optional(Schema.String),
  municipalityCode: Schema.optional(Schema.String),
  region: Schema.optional(Schema.String),
  regionCode: Schema.optional(Schema.String),
  postalCode: Schema.optional(Schema.String),
  country: Schema.String,
  countryCode: Schema.optional(Schema.String),
  locationFormatted: Schema.optional(Schema.String),

  searchText: Schema.optional(Schema.String),

  sources: Schema.Array(JobSourceLink),
  requirements: Schema.Array(JobRequirement),
  contacts: Schema.Array(JobContact),

  matchScore: Schema.optional(Schema.Number),
  matchReasons: Schema.optional(Schema.Array(Schema.String)),
}) {}

export class JobSearchParams extends Schema.Class<JobSearchParams>(
  "JobSearchParams"
)({
  q: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.Number),
  offset: Schema.optional(Schema.Number),
  minMatchScore: Schema.optional(Schema.Number),
  maxMatchScore: Schema.optional(Schema.Number),
  sortByMatch: Schema.optional(Schema.Boolean),
}) {}

export class JobNotFoundError extends Schema.TaggedError<JobNotFoundError>()(
  "JobNotFoundError",
  { id: JobId }
) {}

export const JobRpcError = Schema.Union(JobNotFoundError, DatabaseError);
