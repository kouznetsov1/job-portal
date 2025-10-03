import { Schema } from "effect";

export const Cv = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  pdfPath: Schema.NullOr(Schema.String),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
});

export const CvChatMessage = Schema.Struct({
  id: Schema.String,
  cvId: Schema.String,
  role: Schema.Literal("user", "assistant"),
  content: Schema.String,
  createdAt: Schema.DateTimeUtc,
});
