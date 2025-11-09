import { Schema } from "effect";
import { PlatformError } from "@effect/platform/Error";
import { DatabaseError } from "./database";
import { UserId } from "./user";

export const ProfileId = Schema.String.pipe(Schema.brand("ProfileId"));

export class Experience extends Schema.Class<Experience>("Experience")({
  id: Schema.String,
  title: Schema.String,
  company: Schema.String,
  startDate: Schema.Date,
  endDate: Schema.optional(Schema.Date),
  description: Schema.optional(Schema.String),
  current: Schema.Boolean,
}) {}

export class Education extends Schema.Class<Education>("Education")({
  id: Schema.String,
  institution: Schema.String,
  degree: Schema.String,
  field: Schema.String,
  startDate: Schema.Date,
  endDate: Schema.optional(Schema.Date),
  current: Schema.Boolean,
}) {}

export class UserProfile extends Schema.Class<UserProfile>("UserProfile")({
  id: ProfileId,
  userId: UserId,
  fullName: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  phone: Schema.optional(Schema.String),
  headline: Schema.optional(Schema.String),
  summary: Schema.optional(Schema.String),
  skills: Schema.Array(Schema.String),
  experience: Schema.Array(Experience),
  education: Schema.Array(Education),
  cvFileUrl: Schema.optional(Schema.String),
  linkedinUrl: Schema.optional(Schema.String),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}

export class UpdateProfileData extends Schema.Class<UpdateProfileData>(
  "UpdateProfileData"
)({
  fullName: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  phone: Schema.optional(Schema.String),
  headline: Schema.optional(Schema.String),
  summary: Schema.optional(Schema.String),
  skills: Schema.optional(Schema.Array(Schema.String)),
  experience: Schema.optional(Schema.Array(Experience)),
  education: Schema.optional(Schema.Array(Education)),
  linkedinUrl: Schema.optional(Schema.String),
}) {}

export class CVUploadRequest extends Schema.Class<CVUploadRequest>(
  "CVUploadRequest"
)({
  fileName: Schema.String,
  fileData: Schema.String,
  mimeType: Schema.String,
}) {}

export class ParsedCVResult extends Schema.Class<ParsedCVResult>(
  "ParsedCVResult"
)({
  text: Schema.String,
}) {}

export class ProfileNotFoundError extends Schema.TaggedError<ProfileNotFoundError>()(
  "ProfileNotFoundError",
  { userId: UserId }
) {}

export class CVParseError extends Schema.TaggedError<CVParseError>()(
  "CVParseError",
  { message: Schema.String }
) {}

export const ProfileRpcError = Schema.Union(
  ProfileNotFoundError,
  CVParseError,
  DatabaseError,
  PlatformError
);
