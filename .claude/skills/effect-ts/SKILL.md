---
name: effect-ts
description: Effect-TS patterns for this codebase. Use when creating services, handling errors, using Effect.gen, Schema validation, or any Effect code. Directs to vendor source and existing implementations.
---

# Effect-TS Development

## 🎯 Primary Rule: Check Source Code First

**For new APIs or unfamiliar patterns:**
1. Check `vendor/effect/packages/effect/src/Effect.ts` - Core APIs, Service, combinators
2. Check `vendor/effect/packages/effect/src/Schema.ts` - Validation, TaggedError
3. Check `vendor/effect/packages/effect/src/Data.ts` - Data utilities

**For existing patterns:**
1. Check `apps/server/src/services/` - See how services are implemented
2. Check similar code in the codebase

## Service Creation

**Always use `Effect.Service` (never `Context.Tag`)**

Use `effect` for most services:
```ts
class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.gen(function* () {
    const db = yield* Database;

    // Define functions inside
    const search = (params: Params) =>
      Effect.gen(function* () {
        const results = yield* db.use((p) => p.search(params));
        return results;
      }).pipe(Effect.withSpan("MyService.search"));

    // Export at end
    return { search };
  }),
  dependencies: [Database.Default],
}) {}
```

Use `scoped` for services needing cleanup:
```ts
class FileService extends Effect.Service<FileService>()("FileService", {
  scoped: Effect.gen(function* () {
    const handle = yield* Effect.acquireRelease(
      openFile,
      (h) => Effect.sync(() => h.close())
    );
    return { read: () => handle.read() };
  }),
}) {}
```

Reference: `vendor/effect/packages/effect/src/Effect.ts:13535`

## Forbidden Practices

### ❌ NEVER: try-catch in Effect.gen
```ts
// WRONG
Effect.gen(function* () {
  try { yield* effect; } catch (e) {} // Never reached!
});

// CORRECT
Effect.gen(function* () {
  const result = yield* Effect.result(effect);
  if (result._tag === "Failure") { /* handle */ }
});
```

### ❌ NEVER: Type assertions
Never use `as any`, `as never`, `as unknown` - fix the actual type

### ✅ ALWAYS: return yield* for errors
```ts
Effect.gen(function* () {
  if (invalid) {
    return yield* Effect.fail(new MyError({ message: "failed" }));
  }
  return result;
});
```

## Error Handling

**Always use `Schema.TaggedError` for consistency and RPC compatibility:**

```ts
import { Schema } from "effect";

class MyError extends Schema.TaggedError<MyError>()(
  "MyError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

// Usage
Effect.gen(function* () {
  const result = yield* Effect.tryPromise({
    try: () => fetch(url),
    catch: (error) => new MyError({
      message: String(error),
      cause: error,
    }),
  });
  return result;
});
```

**Why Schema.TaggedError:**
- Required for RPC error serialization
- Provides automatic validation on construction
- Consistent with domain error patterns
- Supports field transformations (DateTimeUtc, etc.)

Reference: `vendor/effect/packages/effect/src/Schema.ts`

## Common Patterns

Search `vendor/effect/packages/effect/src/Effect.ts` for detailed docs:
- `Effect.gen` - Sequential composition
- `Effect.all` - Parallel operations
- `Effect.tryPromise` - Promise handling
- `Effect.catchTag` - Handle specific errors
- `Effect.withSpan` - Tracing
- `Effect.tapError` - Log errors before mapError

## Schema Validation

```ts
import { Schema } from "effect";

const MySchema = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(3)),
});

// In Effect
const validated = yield* Schema.decodeUnknown(MySchema)(input);
```

## Logging Pattern

Keep it minimal - only log errors:
```ts
operation.pipe(
  Effect.withSpan("Service.operation"),
  Effect.annotateLogs({ service: "Service" }),
  Effect.tapError((error) => Effect.logError("Operation failed", error))
);
```
