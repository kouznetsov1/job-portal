import { Schema } from "effect";
import { JobAd } from "@repo/domain";

export const TransformedJob = Schema.Struct({
  sourceId: Schema.String,
  title: Schema.String,
  description: Schema.String,
  url: Schema.NullOr(Schema.URL),
  publishedAt: Schema.DateFromString,
  expiresAt: Schema.NullOr(Schema.DateFromString),
  city: Schema.NullOr(Schema.String),
  region: Schema.NullOr(Schema.String),
  country: Schema.String,
  employerName: Schema.NullOr(Schema.String),
});

export const transformJobAd = Schema.transform(JobAd, TransformedJob, {
  strict: false,
  decode: (jobAd) => ({
    sourceId: jobAd.id,
    title: jobAd.headline,
    description: jobAd.description?.text,
    url: jobAd.webpage_url ? String(jobAd.webpage_url) : null,
    publishedAt: jobAd.publication_date ?? new Date().toISOString(),
    expiresAt: jobAd.application_deadline ?? null,
    city: jobAd.workplace_address?.city ?? null,
    region: jobAd.workplace_address?.region ?? null,
    country: jobAd.workplace_address?.country ?? "Sverige",
    employerName: jobAd.employer?.name ?? null,
  }),
  encode: (transformed) => ({
    id: transformed.sourceId,
    headline: transformed.title,
    description: {
      text: transformed.description,
    },
  }),
});
