import { Schema } from "effect";
import { DatabaseError } from "./database";

export const CompanyId = Schema.String.pipe(Schema.brand("CompanyId"));

export class Company extends Schema.Class<Company>("Company")({
  id: CompanyId,
  name: Schema.String,
  organizationNumber: Schema.optional(Schema.String),
  website: Schema.optional(Schema.String),
  logo: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  industry: Schema.optional(Schema.String),
  size: Schema.optional(Schema.String),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}

export class CompanyDetailed extends Schema.Class<CompanyDetailed>(
  "CompanyDetailed"
)({
  id: CompanyId,
  name: Schema.String,
  slug: Schema.String,
  organizationNumber: Schema.optional(Schema.String),
  website: Schema.optional(Schema.String),
  logo: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  aiDescription: Schema.optional(Schema.String),
  industry: Schema.optional(Schema.String),
  size: Schema.optional(Schema.String),
  socialMedia: Schema.optional(Schema.Unknown),
  scrapedData: Schema.optional(Schema.Unknown),
  lastEnriched: Schema.optional(Schema.Date),
  jobCount: Schema.Number,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}

export class CompanySearchParams extends Schema.Class<CompanySearchParams>(
  "CompanySearchParams"
)({
  q: Schema.optional(Schema.String),
  industry: Schema.optional(Schema.String),
  minSize: Schema.optional(Schema.Number),
  maxSize: Schema.optional(Schema.Number),
  page: Schema.optional(Schema.Number),
  pageSize: Schema.optional(Schema.Number),
}) {}

export class CompanySearchResult extends Schema.Class<CompanySearchResult>(
  "CompanySearchResult"
)({
  companies: Schema.Array(CompanyDetailed),
  total: Schema.Number,
  page: Schema.Number,
  pageSize: Schema.Number,
}) {}

export class CompanyNotFoundError extends Schema.TaggedError<CompanyNotFoundError>()(
  "CompanyNotFoundError",
  { id: CompanyId }
) {}

export const CompanyRpcError = Schema.Union(
  CompanyNotFoundError,
  DatabaseError
);
