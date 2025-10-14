import { Schema, Effect, ParseResult } from "effect";
import { JobAd } from "@repo/domain";

const extractTaxonomyLabel = (
  item: { readonly label?: string | null | undefined } | null | undefined,
): string | null => (item?.label !== undefined ? item.label : null);

const parseCoordinates = (
  coords: readonly (number | null)[] | null | undefined,
): [number, number] | null => {
  if (!coords || coords.length !== 2) return null;
  const lon = coords[0];
  const lat = coords[1];
  if (lon === null || lat === null || lon === undefined || lat === undefined)
    return null;
  return [lon, lat];
};

const detectRemoteWork = (description: string): boolean => {
  const lowerDesc = description.toLowerCase();
  return (
    lowerDesc.includes("distans") ||
    lowerDesc.includes("remote") ||
    lowerDesc.includes("hemarbete")
  );
};

export const TransformedCompanySchema = Schema.Struct({
  name: Schema.String,
  organizationNumber: Schema.NullOr(Schema.String),
  website: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
});

export const TransformedRequirementSchema = Schema.Struct({
  requirementType: Schema.Literal("must_have", "nice_to_have"),
  category: Schema.String,
  label: Schema.String,
  weight: Schema.NullOr(Schema.Number),
});

export const TransformedContactSchema = Schema.Struct({
  name: Schema.NullOr(Schema.String),
  role: Schema.NullOr(Schema.String),
  email: Schema.NullOr(Schema.String),
  phone: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
});

export const TransformedJobSchema = Schema.Struct({
  sourceId: Schema.String,
  sourceUrl: Schema.String,

  title: Schema.String,
  description: Schema.String,
  publishedAt: Schema.DateFromString,
  lastPublicationDate: Schema.NullOr(Schema.DateFromString),
  expiresAt: Schema.NullOr(Schema.DateFromString),
  removed: Schema.Boolean,
  removedAt: Schema.NullOr(Schema.DateFromString),

  company: TransformedCompanySchema,

  employmentType: Schema.NullOr(Schema.String),
  workingHoursType: Schema.NullOr(Schema.String),
  duration: Schema.NullOr(Schema.String),

  vacancies: Schema.NullOr(Schema.Number),
  startDate: Schema.NullOr(Schema.String),
  workloadMin: Schema.NullOr(Schema.Number),
  workloadMax: Schema.NullOr(Schema.Number),

  salaryType: Schema.NullOr(Schema.String),
  salaryDescription: Schema.NullOr(Schema.String),

  occupation: Schema.NullOr(Schema.String),
  occupationGroup: Schema.NullOr(Schema.String),
  occupationField: Schema.NullOr(Schema.String),

  experienceRequired: Schema.Boolean,
  drivingLicenseRequired: Schema.Boolean,
  accessToOwnCar: Schema.Boolean,

  applicationDeadline: Schema.NullOr(Schema.DateFromString),
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
  coordinates: Schema.NullOr(Schema.Tuple(Schema.Number, Schema.Number)),

  requirements: Schema.Array(TransformedRequirementSchema),
  contacts: Schema.Array(TransformedContactSchema),
});

export type TransformedJob = typeof TransformedJobSchema.Type;

export const PlatsbankenJobTransform = Schema.transformOrFail(
  JobAd,
  TransformedJobSchema,
  {
    strict: false,
    decode: (jobAd, _, ast) =>
      Effect.gen(function* () {
        const title = jobAd.headline || "";
        if (!title.trim()) {
          return yield* ParseResult.fail(
            new ParseResult.Type(ast, jobAd, "No title in job"),
          );
        }

        const description =
          jobAd.description?.text_formatted || jobAd.description?.text || "";

        const employer = jobAd.employer;

        if (!employer) {
          return yield* ParseResult.fail(
            new ParseResult.Type(ast, jobAd, "Missing employer"),
          );
        }

        const company = {
          name: employer.name || "Okänd arbetsgivare",
          organizationNumber: employer.organization_number ?? null,
          website: employer.url ?? null,
          description: jobAd.description?.company_information ?? null,
        };

        const extractRequirementsFromCategory = (
          items:
            | readonly {
                readonly label?: string | null | undefined;
                readonly weight?: number | null | undefined;
              }[]
            | null
            | undefined,
          category: string,
          requirementType: "must_have" | "nice_to_have",
        ) => {
          if (!items || !Array.isArray(items)) return [];
          return items
            .filter((item) => item?.label !== undefined && item.label !== null)
            .map((item) => ({
              requirementType,
              category,
              label: item.label!,
              weight: item.weight !== undefined ? item.weight : null,
            }));
        };

        const mustHaveReqs = [
          ...extractRequirementsFromCategory(
            jobAd.must_have?.skills,
            "skill",
            "must_have",
          ),
          ...extractRequirementsFromCategory(
            jobAd.must_have?.languages,
            "language",
            "must_have",
          ),
          ...extractRequirementsFromCategory(
            jobAd.must_have?.work_experiences,
            "work_experience",
            "must_have",
          ),
          ...extractRequirementsFromCategory(
            jobAd.must_have?.education,
            "education",
            "must_have",
          ),
          ...extractRequirementsFromCategory(
            jobAd.must_have?.education_level,
            "education_level",
            "must_have",
          ),
        ];

        const niceToHaveReqs = [
          ...extractRequirementsFromCategory(
            jobAd.nice_to_have?.skills,
            "skill",
            "nice_to_have",
          ),
          ...extractRequirementsFromCategory(
            jobAd.nice_to_have?.languages,
            "language",
            "nice_to_have",
          ),
          ...extractRequirementsFromCategory(
            jobAd.nice_to_have?.work_experiences,
            "work_experience",
            "nice_to_have",
          ),
          ...extractRequirementsFromCategory(
            jobAd.nice_to_have?.education,
            "education",
            "nice_to_have",
          ),
          ...extractRequirementsFromCategory(
            jobAd.nice_to_have?.education_level,
            "education_level",
            "nice_to_have",
          ),
        ];

        const contacts = (jobAd.application_contacts ?? [])
          .filter((c) => c !== null)
          .map((contact) => ({
            name: contact.name ?? contact.description ?? null,
            role: contact.contact_type ?? null,
            email: contact.email ?? null,
            phone: contact.telephone ?? null,
            description: contact.description ?? null,
          }));

        return yield* ParseResult.succeed({
          sourceId: jobAd.id,
          sourceUrl:
            typeof jobAd.webpage_url === "string"
              ? jobAd.webpage_url
              : `https://arbetsformedlingen.se/platsbanken/annonser/${jobAd.id}`,

          title,
          description,
          publishedAt: jobAd.publication_date || new Date().toISOString(),
          lastPublicationDate: jobAd.last_publication_date ?? null,
          expiresAt: jobAd.application_deadline ?? null,
          removed: jobAd.removed ?? false,
          removedAt: jobAd.removed_date ?? null,

          company,

          employmentType: extractTaxonomyLabel(jobAd.employment_type),
          workingHoursType: extractTaxonomyLabel(jobAd.working_hours_type),
          duration: extractTaxonomyLabel(jobAd.duration),

          vacancies: jobAd.number_of_vacancies ?? null,
          startDate: jobAd.access ?? null,
          workloadMin: jobAd.scope_of_work?.min ?? null,
          workloadMax: jobAd.scope_of_work?.max ?? null,

          salaryType: extractTaxonomyLabel(jobAd.salary_type),
          salaryDescription: jobAd.salary_description ?? null,

          occupation: extractTaxonomyLabel(jobAd.occupation),
          occupationGroup: extractTaxonomyLabel(jobAd.occupation_group),
          occupationField: extractTaxonomyLabel(jobAd.occupation_field),

          experienceRequired: jobAd.experience_required ?? false,
          drivingLicenseRequired: jobAd.driving_license_required ?? false,
          accessToOwnCar: jobAd.access_to_own_car ?? false,

          applicationDeadline: jobAd.application_deadline ?? null,
          applicationInstructions:
            jobAd.application_details?.information ?? null,
          applicationUrl: jobAd.application_details?.url ?? null,
          applicationEmail: jobAd.application_details?.email ?? null,
          applicationReference: jobAd.application_details?.reference ?? null,
          applicationViaAf: jobAd.application_details?.via_af ?? false,
          applicationOther: jobAd.application_details?.other ?? null,

          workplace: jobAd.employer?.workplace ?? null,
          remote: detectRemoteWork(description),
          streetAddress: jobAd.workplace_address?.street_address ?? null,
          city: jobAd.workplace_address?.city ?? null,
          municipality: jobAd.workplace_address?.municipality ?? null,
          municipalityCode: jobAd.workplace_address?.municipality_code ?? null,
          region: jobAd.workplace_address?.region ?? null,
          regionCode: jobAd.workplace_address?.region_code ?? null,
          postalCode: jobAd.workplace_address?.postcode ?? null,
          country: jobAd.workplace_address?.country || "Sverige",
          countryCode: jobAd.workplace_address?.country_code ?? null,
          coordinates: parseCoordinates(jobAd.workplace_address?.coordinates),

          requirements: [...mustHaveReqs, ...niceToHaveReqs],
          contacts,
        });
      }),
    encode: (transformed) =>
      Effect.succeed({
        id: transformed.sourceId,
        headline: transformed.title,
        description: {
          text: transformed.description,
        },
      }),
  },
);
