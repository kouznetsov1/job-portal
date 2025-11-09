import { Schema } from "effect";
import { DatabaseError } from "./database";
import { Job, JobId } from "./job";
import { UserId } from "./user";

export const ApplicationId = Schema.String.pipe(Schema.brand("ApplicationId"));

export const ApplicationStatus = Schema.Literal("DRAFT", "APPLIED", "ARCHIVED");

export const GenerationStage = Schema.Literal(
  "researching_company",
  "analyzing_job",
  "generating_letter",
  "finalizing",
  "complete"
);

export class Application extends Schema.Class<Application>("Application")({
  id: ApplicationId,
  userId: UserId,
  jobId: JobId,
  job: Job,
  generatedLetterText: Schema.String,
  status: ApplicationStatus,
  createdAt: Schema.Date,
  appliedAt: Schema.optional(Schema.Date),
}) {}

export class GenerateApplicationRequest extends Schema.Class<GenerateApplicationRequest>(
  "GenerateApplicationRequest"
)({
  jobId: JobId,
}) {}

export class GenerationProgress extends Schema.Class<GenerationProgress>(
  "GenerationProgress"
)({
  stage: GenerationStage,
  message: Schema.String,
  done: Schema.Boolean,
  applicationId: Schema.optional(ApplicationId),
}) {}

export class RegenerateApplicationRequest extends Schema.Class<RegenerateApplicationRequest>(
  "RegenerateApplicationRequest"
)({
  applicationId: ApplicationId,
  feedback: Schema.optional(Schema.String),
}) {}

export class DownloadApplicationRequest extends Schema.Class<DownloadApplicationRequest>(
  "DownloadApplicationRequest"
)({
  applicationId: ApplicationId,
}) {}

export class DownloadApplicationResult extends Schema.Class<DownloadApplicationResult>(
  "DownloadApplicationResult"
)({
  fileName: Schema.String,
  fileData: Schema.String,
  mimeType: Schema.String,
}) {}

export class MarkAppliedRequest extends Schema.Class<MarkAppliedRequest>(
  "MarkAppliedRequest"
)({
  applicationId: ApplicationId,
}) {}

export class ApplicationNotFoundError extends Schema.TaggedError<ApplicationNotFoundError>()(
  "ApplicationNotFoundError",
  { id: ApplicationId }
) {}

export class ApplicationGenerationError extends Schema.TaggedError<ApplicationGenerationError>()(
  "ApplicationGenerationError",
  { message: Schema.String }
) {}

export const ApplicationRpcError = Schema.Union(
  ApplicationNotFoundError,
  ApplicationGenerationError,
  DatabaseError
);
