# Development Log

## 2025-10-19

Updated dependencies across all packages and reorganized Prisma schema into separate domain-specific files (auth.prisma, cv.prisma, job.prisma, user.prisma) for better maintainability.

## 2025-10-16

Consolidated job domains from jobads to unified jobs architecture with new JobService, extracted scheduler logic into dedicated module, updated UI components and RPC routing to match new flat job schema structure, and removed deprecated CV routes.

## 2025-10-15

Built consolidated PlatsbankenSyncService with hourly Effect Cron scheduler, smart removal handling for deleted jobs, reliable timestamp tracking via lastChecked field, refactored all Prisma calls to db.use pattern for consistent error handling, cleaned up test files, and fixed TypeScript errors by exporting RateLimitError.

## 2025-10-14

Migrated from Platsbanken JobSearch API to JobStream API, implementing snapshot() for full data fetches and stream() for incremental date-based updates with occupation/location filtering, improved error handling with Effect.retry predicates, and fixed label field schema parsing.

## 2025-10-13

Implemented pagination with Stream.paginateChunkEffect and rate limit handling using catchTag, fetched 2100 jobs before hitting schema validation errors.

## 2025-10-10

Designed and implemented Prisma schema for Platsbanken job integration. Updated Job, Company, JobRequirement, JobSourceLink, and JobContact models to match Platsbanken API structure, including support for occupation taxonomy, requirements (must_have/nice_to_have), location with PostGIS coordinates, and remote work detection. Removed unnecessary enums and tables (JobStatus, EmploymentType, WorkArrangement, ExperienceLevel, JobCategory, JobSkill, JobApplicationMethod) in favor of flexible string fields and direct relationships.
