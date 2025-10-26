# Plan

## Today (2025-10-26)

### Priority: Option Refactoring (Replace nullable patterns with Effect Option)

1. Refactor domain schemas to use Schema.Option instead of Schema.NullOr
   - Start with packages/domain/src/domains/jobs.ts (40+ fields)
   - Then packages/domain/src/domains/platsbanken.ts (50+ fields)
2. Update service methods to handle Option types
   - apps/server/src/services/platsbanken-sync.ts (3 nullable DB results)
   - apps/server/src/services/job-service.ts (1 nullable DB result)
3. Refactor transformation utilities to use Option
   - apps/server/src/services/platsbanken-job-transform.ts (3 nullable functions)
4. Run linter and type checks to ensure everything passes

### Stretch: AI Chat Integration (if time permits)
- Research Vercel AI SDK + Effect-TS integration patterns
- Set up basic AI SDK dependencies
