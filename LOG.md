# Development Log

## 2025-10-28

Refactored Platsbanken integration by consolidating all services into a dedicated services/platsbanken/ directory, renamed JobSyncSchedulerLayer to PlatsbankenSyncSchedulerLayer, and removed legacy integration files.

## 2025-10-27

Migrated chat system from Vercel AI SDK to @effect/ai with OpenAI provider, implemented Prisma-backed persistence layer for chat history with 30-day TTL, created OpenAI language model layer with FetchHttpClient, and updated RPC schemas and handlers to use Chat.Persistence with streaming responses.

## 2025-10-26

Added AI chat streaming with OpenAI integration using NDJSON protocol, refactored codebase with Option patterns and improved linter configuration, implemented accessibility fixes with safer type annotations, and created slash commands for project management workflow.

## 2025-10-22

Refactored RPC architecture by removing WebSocket protocol in favor of HTTP-only, fixed client imports to use proper Effect module paths, enhanced JobService with tracing spans and error logging, cleaned up job sync scheduler, and added logging/tracing guidelines to CLAUDE.md.

## 2025-10-21

Refactored JobService to use Schema validation with proper tagged errors (JobSearchError, JobNotFoundError), updated PlatsbankenSyncService to handle company logos and improved job upsertion logic, and cleaned up Vite config by removing unnecessary SSR externals.

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
