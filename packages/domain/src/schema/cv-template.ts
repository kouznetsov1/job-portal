import { Schema } from "effect";
import { DatabaseError } from "./database";

export const CVTemplateId = Schema.String.pipe(Schema.brand("CVTemplateId"));

export class CVTemplate extends Schema.Class<CVTemplate>("CVTemplate")({
  id: CVTemplateId,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  typstCode: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}

export class TemplateNotFoundError extends Schema.TaggedError<TemplateNotFoundError>()(
  "TemplateNotFoundError",
  { id: CVTemplateId },
) {}

export const TemplateRpcError = Schema.Union(TemplateNotFoundError, DatabaseError);
