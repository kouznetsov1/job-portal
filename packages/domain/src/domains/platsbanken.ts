import { Schema } from "effect";

export const PlatsbankenSearchInput = Schema.Struct({
  q: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.Number),
  offset: Schema.optional(Schema.Number),
});

export const JobTechTaxonomyItem = Schema.Struct({
  concept_id: Schema.optional(Schema.NullOr(Schema.String)),
  label: Schema.optional(Schema.NullOr(Schema.String)),
  legacy_ams_taxonomy_id: Schema.optional(Schema.NullOr(Schema.String)),
});

export const WeightedJobtechTaxonomyItem = Schema.Struct({
  concept_id: Schema.optional(Schema.NullOr(Schema.String)),
  label: Schema.optional(Schema.NullOr(Schema.String)),
  legacy_ams_taxonomy_id: Schema.optional(Schema.NullOr(Schema.String)),
  weight: Schema.optional(Schema.NullOr(Schema.Number)),
});

export const ScopeOfWork = Schema.Struct({
  min: Schema.optional(Schema.NullOr(Schema.Number)),
  max: Schema.optional(Schema.NullOr(Schema.Number)),
});

export const Employer = Schema.Struct({
  phone_number: Schema.optional(Schema.NullOr(Schema.String)),
  email: Schema.optional(Schema.NullOr(Schema.String)),
  url: Schema.optional(Schema.NullOr(Schema.String)),
  organization_number: Schema.optional(Schema.NullOr(Schema.String)),
  name: Schema.optional(Schema.NullOr(Schema.String)),
  workplace: Schema.optional(Schema.NullOr(Schema.String)),
});

export const ApplicationDetails = Schema.Struct({
  information: Schema.optional(Schema.NullOr(Schema.String)),
  reference: Schema.optional(Schema.NullOr(Schema.String)),
  email: Schema.optional(Schema.NullOr(Schema.String)),
  via_af: Schema.optional(Schema.NullOr(Schema.Boolean)),
  url: Schema.optional(Schema.NullOr(Schema.String)),
  other: Schema.optional(Schema.NullOr(Schema.String)),
});

export const WorkplaceAddress = Schema.Struct({
  municipality: Schema.optional(Schema.NullOr(Schema.String)),
  municipality_code: Schema.optional(Schema.NullOr(Schema.String)),
  municipality_concept_id: Schema.optional(Schema.NullOr(Schema.String)),
  region: Schema.optional(Schema.NullOr(Schema.String)),
  region_code: Schema.optional(Schema.NullOr(Schema.String)),
  region_concept_id: Schema.optional(Schema.NullOr(Schema.String)),
  country: Schema.optional(Schema.NullOr(Schema.String)),
  country_code: Schema.optional(Schema.NullOr(Schema.String)),
  country_concept_id: Schema.optional(Schema.NullOr(Schema.String)),
  street_address: Schema.optional(Schema.NullOr(Schema.String)),
  postcode: Schema.optional(Schema.NullOr(Schema.String)),
  city: Schema.optional(Schema.NullOr(Schema.String)),
  coordinates: Schema.optional(
    Schema.NullOr(Schema.Array(Schema.NullOr(Schema.Number))),
  ),
});

export const Requirements = Schema.Struct({
  skills: Schema.optional(
    Schema.NullOr(Schema.Array(WeightedJobtechTaxonomyItem)),
  ),
  languages: Schema.optional(
    Schema.NullOr(Schema.Array(WeightedJobtechTaxonomyItem)),
  ),
  work_experiences: Schema.optional(
    Schema.NullOr(Schema.Array(WeightedJobtechTaxonomyItem)),
  ),
  education: Schema.optional(
    Schema.NullOr(Schema.Array(WeightedJobtechTaxonomyItem)),
  ),
  education_level: Schema.optional(
    Schema.NullOr(Schema.Array(WeightedJobtechTaxonomyItem)),
  ),
});

export const ApplicationContact = Schema.Struct({
  name: Schema.optional(Schema.NullOr(Schema.String)),
  description: Schema.optional(Schema.NullOr(Schema.String)),
  email: Schema.optional(Schema.NullOr(Schema.String)),
  telephone: Schema.optional(Schema.NullOr(Schema.String)),
  contact_type: Schema.optional(Schema.NullOr(Schema.String)),
});

export const JobAdDescription = Schema.Struct({
  text: Schema.optional(Schema.NullOr(Schema.String)),
  text_formatted: Schema.optional(Schema.NullOr(Schema.String)),
  company_information: Schema.optional(Schema.NullOr(Schema.String)),
  needs: Schema.optional(Schema.NullOr(Schema.String)),
  requirements: Schema.optional(Schema.NullOr(Schema.String)),
  conditions: Schema.optional(Schema.NullOr(Schema.String)),
});

export const JobAd = Schema.Struct({
  id: Schema.String,
  external_id: Schema.optional(Schema.NullOr(Schema.String)),
  original_id: Schema.optional(Schema.NullOr(Schema.String)),
  label: Schema.optional(
    Schema.NullOr(
      Schema.Union(
        Schema.Array(Schema.String),
        Schema.transform(Schema.String, Schema.Array(Schema.String), {
          decode: (str) => {
            if (str === "[]") { return []; }
            if (str.startsWith("[") && str.endsWith("]")) {
              try {
                return JSON.parse(str.replace(/'/g, '"'));
              } catch {
                return [];
              }
            }
            return [];
          },
          encode: (arr) => JSON.stringify(arr),
        }),
      ),
    ),
  ),
  webpage_url: Schema.optional(Schema.Unknown),
  logo_url: Schema.optional(Schema.NullOr(Schema.String)),
  headline: Schema.optional(Schema.NullOr(Schema.String)),
  application_deadline: Schema.optional(Schema.NullOr(Schema.String)),
  number_of_vacancies: Schema.optional(Schema.NullOr(Schema.Number)),
  description: Schema.optional(Schema.NullOr(JobAdDescription)),
  employment_type: Schema.optional(Schema.NullOr(JobTechTaxonomyItem)),
  salary_type: Schema.optional(Schema.NullOr(JobTechTaxonomyItem)),
  salary_description: Schema.optional(Schema.NullOr(Schema.String)),
  duration: Schema.optional(Schema.NullOr(JobTechTaxonomyItem)),
  working_hours_type: Schema.optional(Schema.NullOr(JobTechTaxonomyItem)),
  scope_of_work: Schema.optional(Schema.NullOr(ScopeOfWork)),
  access: Schema.optional(Schema.NullOr(Schema.String)),
  employer: Schema.optional(Schema.NullOr(Employer)),
  application_details: Schema.optional(Schema.NullOr(ApplicationDetails)),
  experience_required: Schema.optional(Schema.NullOr(Schema.Boolean)),
  access_to_own_car: Schema.optional(Schema.NullOr(Schema.Boolean)),
  driving_license_required: Schema.optional(Schema.NullOr(Schema.Boolean)),
  driving_license: Schema.optional(
    Schema.NullOr(Schema.Array(JobTechTaxonomyItem)),
  ),
  occupation: Schema.optional(Schema.NullOr(JobTechTaxonomyItem)),
  occupation_group: Schema.optional(Schema.NullOr(JobTechTaxonomyItem)),
  occupation_field: Schema.optional(Schema.NullOr(JobTechTaxonomyItem)),
  workplace_address: Schema.optional(Schema.NullOr(WorkplaceAddress)),
  must_have: Schema.optional(Schema.NullOr(Requirements)),
  nice_to_have: Schema.optional(Schema.NullOr(Requirements)),
  application_contacts: Schema.optional(
    Schema.NullOr(Schema.Array(ApplicationContact)),
  ),
  publication_date: Schema.optional(Schema.NullOr(Schema.String)),
  last_publication_date: Schema.optional(Schema.NullOr(Schema.String)),
  removed: Schema.optional(Schema.NullOr(Schema.Boolean)),
  removed_date: Schema.optional(Schema.NullOr(Schema.String)),
  source_type: Schema.optional(Schema.NullOr(Schema.String)),
  timestamp: Schema.optional(Schema.NullOr(Schema.Number)),
});

export const JobAdSearchResult = Schema.Struct({
  ...JobAd.fields,
  relevance: Schema.optional(Schema.NullOr(Schema.Number)),
});

export const NumberOfHits = Schema.Struct({
  value: Schema.Number,
});

export const StatDetail = Schema.Struct({
  term: Schema.optional(Schema.NullOr(Schema.String)),
  concept_id: Schema.optional(Schema.NullOr(Schema.String)),
  code: Schema.optional(Schema.NullOr(Schema.String)),
  count: Schema.optional(Schema.NullOr(Schema.Number)),
});

export const Stats = Schema.Struct({
  type: Schema.optional(Schema.NullOr(Schema.String)),
  values: Schema.optional(Schema.NullOr(Schema.Array(StatDetail))),
});

export const FreetextConcepts = Schema.Struct({
  skill: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  occupation: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  location: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  skill_must: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  occupation_must: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  location_must: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  skill_must_not: Schema.optional(Schema.NullOr(Schema.Array(Schema.String))),
  occupation_must_not: Schema.optional(
    Schema.NullOr(Schema.Array(Schema.String)),
  ),
  location_must_not: Schema.optional(
    Schema.NullOr(Schema.Array(Schema.String)),
  ),
});

export const SearchResults = Schema.Struct({
  total: NumberOfHits,
  positions: Schema.optional(Schema.NullOr(Schema.Number)),
  query_time_in_millis: Schema.optional(Schema.NullOr(Schema.Number)),
  result_time_in_millis: Schema.optional(Schema.NullOr(Schema.Number)),
  stats: Schema.optional(Schema.NullOr(Schema.Array(Stats))),
  freetext_concepts: Schema.optional(Schema.NullOr(FreetextConcepts)),
  hits: Schema.Array(JobAdSearchResult),
});

export const TypeaheadItem = Schema.Struct({
  value: Schema.optional(Schema.NullOr(Schema.String)),
  found_phrase: Schema.optional(Schema.NullOr(Schema.String)),
  type: Schema.optional(Schema.NullOr(Schema.String)),
  occurrences: Schema.optional(Schema.NullOr(Schema.Number)),
});

export const TypeaheadParams = Schema.Struct({
  q: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.Number),
  contextual: Schema.optional(Schema.Boolean),
  label: Schema.optional(Schema.Array(Schema.String)),
});

export const TypeaheadResults = Schema.Struct({
  result_time_in_millis: Schema.optional(Schema.NullOr(Schema.Number)),
  time_in_millis: Schema.optional(Schema.NullOr(Schema.Number)),
  typeahead: Schema.optional(Schema.NullOr(Schema.Array(TypeaheadItem))),
});

// JobStream API schemas
export const JobStreamResponse = Schema.Array(JobAd);
