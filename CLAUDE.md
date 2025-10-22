# Claude Instructions

This is instructions for Claude when working in the repo for job portal named Searcha.

## 🚨 HIGHEST PRIORITY RULES 🚨

### User-Facing Language

**ALL user-facing text MUST be in Swedish!**

- This includes all UI labels, buttons, messages, descriptions, placeholders, and error messages
- Form validation error messages must be in Swedish
- Authentication error messages must be in Swedish
- All user-visible content should be written in Swedish
- Code comments and developer documentation remain in English

### ABSOLUTELY FORBIDDEN: try-catch in Effect.gen

**NEVER use `try-catch` blocks inside `Effect.gen` generators!**

- Effect generators handle errors through the Effect type system, not JavaScript exceptions
- Use `Effect.tryPromise`, `Effect.try`, or proper Effect error handling instead
- **CRITICAL**: This will cause runtime errors and break Effect's error handling
- **EXAMPLE OF WHAT NOT TO DO**:
  ```ts
  Effect.gen(function* () {
    try {
      // ❌ WRONG - Never do this in Effect.gen
      const result = yield* someEffect;
    } catch (error) {
      // ❌ This will never be reached and breaks Effect semantics
    }
  });
  ```
- **CORRECT PATTERN**:
  ```ts
  Effect.gen(function* () {
    // ✅ Use Effect's built-in error handling
    const result = yield* Effect.result(someEffect);
    if (result._tag === "Failure") {
      // Handle error case
    }
  });
  ```

### ABSOLUTELY FORBIDDEN: Type Assertions

**NEVER EVER use `as never`, `as any`, or `as unknown` type assertions!**

- These break TypeScript's type safety and hide real type errors
- Always fix the underlying type issues instead of masking them
- **FORBIDDEN PATTERNS**:
  ```ts
  // ❌ NEVER do any of these
  const value = something as any;
  const value = something as never;
  const value = something as unknown;
  ```
- **CORRECT APPROACH**: Fix the actual type mismatch by:
  - Using proper generic type parameters
  - Importing correct types
  - Using proper Effect constructors and combinators
  - Adjusting function signatures to match usage

### MANDATORY: Return Yield Pattern for Errors

**ALWAYS use `return yield*` when yielding errors or interrupts in Effect.gen!**

- When yielding `Effect.fail`, `Effect.interrupt`, or other terminal effects, always use `return yield*`
- This makes it clear that the generator function terminates at that point
- **MANDATORY PATTERN**:

  ```ts
  Effect.gen(function* () {
    if (someCondition) {
      // ✅ CORRECT - Always use return yield* for errors
      return yield* Effect.fail("error message");
    }

    if (shouldInterrupt) {
      // ✅ CORRECT - Always use return yield* for interrupts
      return yield* Effect.interrupt;
    }

    // Continue with normal flow...
    const result = yield* someOtherEffect;
    return result;
  });
  ```

- **WRONG PATTERNS**:
  ```ts
  Effect.gen(function* () {
    if (someCondition) {
      // ❌ WRONG - Missing return keyword
      yield* Effect.fail("error message");
      // Unreachable code after error!
    }
  });
  ```
- **CRITICAL**: Always use `return yield*` to make termination explicit and avoid unreachable code

## Project Overview

This is full stack repo built with Effect TS and Tanstack Start (Tanstack Router), using functional programming patterns and effect systems in TypeScript.

## Form Management

### TanStack Form

**Use `@tanstack/react-form` for all form state management and validation.**

**Basic Usage:**

```typescript
import { useForm } from '@tanstack/react-form'
import { Schema } from 'effect'
import { useAtomSet } from '@effect-atom/atom-react'

const FormDataSchema = Schema.Struct({
  firstName: Schema.String.pipe(
    Schema.minLength(3),
    Schema.annotations({
      message: () => 'You must have a length of at least 3',
    }),
  ),
})

const FormSchema = Schema.standardSchemaV1(FormDataSchema)

function MyForm() {
  const submitForm = useAtomSet(MyRpcClient.mutation('submitForm'))

  const form = useForm({
    defaultValues: {
      firstName: '',
    },
    validators: {
      onChange: FormSchema,
    },
    onSubmit: async ({ value }) => {
      submitForm({ payload: value, reactivityKeys: ['forms'] })
    },
  })

  return (
    <form.Field
      name="firstName"
      children={(field) => (
        <input
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )}
    />
  )
}
```

**Integration with Effect:**

- **Effect Schema for Validation**: Wrap schemas with `Schema.standardSchemaV1()` to use in form validators
- **effect-atom Mutations**: Use `useAtomSet(Client.mutation())` for form submission
- **Reactivity Keys**: Mutations can invalidate queries by passing `reactivityKeys` - when the mutation completes, any queries with matching reactivity keys will automatically refresh

**Key Patterns:**

- Use `form.Field` for type-safe field rendering
- Use `form.Subscribe` to react to form state (canSubmit, isSubmitting, etc.)
- Access field state via `field.state.value`, `field.state.meta.errors`
- Field-level and form-level validation with `validators: { onChange, onBlur, onMount }`

## Development Workflow

### Core Principles

- **Research → Plan → Implement**: Never jump straight to coding
- **Reality Checkpoints**: Regularly validate progress and approach
- **Zero Tolerance for Errors**: All automated checks must pass
- **Clarity over Cleverness**: Choose clear, maintainable solutions

### When Stuck

- Stop spiraling into complex solutions
- Break down the problem into smaller parts
- Use the Task tool for parallel problem-solving
- Simplify the approach
- Ask for guidance rather than guessing

**Key Requirements:**

- **Working Examples**: All code must compile and be type-safe
- **Effect Patterns**: Demonstrate proper Effect library usage

**Critical Guidelines:**

- **FORBIDDEN**: Never use `declare const Service: any` - import actual services or use proper type definitions
- Avoid use of `as unknown` - prefer proper constructors and type-safe patterns
- Use proper Effect library patterns and constructors (e.g., `Array.make()`, `Chunk.fromIterable()`)
- Add explicit type annotations when TypeScript type inference fails
- **CRITICAL**: Use proper nesting for namespaced types (e.g., `Effect.Effect.Success` not `Effect.Success`, `Effect.All.EffectAny` not `Effect.EffectAny`)
- **MANDATORY**: Always check if types are nested within namespaces and use proper access syntax `Module.Namespace.Type`
- **TYPE EXTRACTORS**: For type-level utilities like `Request.Request.Success<T>`, demonstrate type extraction using conditional types and `infer`, not instance creation

### Documentation Standards

**Import Patterns:**

```typescript
// Core Effect library imports
import { Schedule, Effect, Duration, Console } from "effect";

// For type-only imports when needed
import type { Schedule, Schema } from "effect";
```

**Error Handling:**

```typescript
// Use Data.TaggedError for custom errors
import { Data } from "effect";

class CustomError extends Data.TaggedError("CustomError")<{
  message: string;
}> {}
```

**Effect Patterns:**

```typescript
// Use Effect.gen for monadic composition
const program = Effect.gen(function* () {
  const result = yield* someEffect;
  return result;
});

// Use proper error handling
const safeProgram = Effect.gen(function* () {
  const result = yield* Effect.tryPromise({
    try: () => someAsyncOperation(),
    catch: (error) => new CustomError({ message: String(error) }),
  });
  return result;
});
```

**Schema Patterns:**

```typescript
// Basic schema usage
import { Schema } from "effect/schema";

// Simple validation
const result = Schema.decodeUnknownSync(Schema.String)("hello");

// With Effect for async validation
import { Effect } from "effect";
import { Schema } from "effect/schema";

const program = Effect.gen(function* () {
  const validated = yield* Schema.decodeUnknownEffect(Schema.Number)(42);
  return validated;
});

// Struct schemas
const PersonSchema = Schema.Struct({
  name: Schema.String,
  age: Schema.Number,
});

// Complex validation with error handling
const safeValidation = Effect.gen(function* () {
  const result = yield* Schema.decodeUnknownEffect(PersonSchema)(input);
  console.log("Valid person:", result);
  return result;
});
```

**Categories to Use:**

- `constructors` - Functions that create new instances
- `destructors` - Functions that extract or convert values
- `combinators` - Functions that combine or transform existing values
- `utilities` - Helper functions and common operations
- `predicates` - Functions that return boolean values
- `getters` - Functions that extract properties or values
- `models` - Types, interfaces, and data structures
- `symbols` - Type identifiers and branded types
- `guards` - Type guard functions
- `refinements` - Type refinement functions
- `mapping` - Transformation functions
- `filtering` - Selection and filtering operations
- `folding` - Reduction and aggregation operations
- `sequencing` - Sequential operation combinators
- `error handling` - Error management functions
- `resource management` - Resource lifecycle functions
- `concurrency` - Concurrent operation utilities
- `testing` - Test utilities and helpers
- `interop` - Interoperability functions

### Common Issues to Avoid

- ❌ **Using `any` types** - Always use proper TypeScript types
- ❌ **Import errors** - Check module exports and correct import paths
- ❌ **Namespace confusion** - Use correct type references (e.g., `Schedule.InputMetadata`)
- ❌ **Array vs Tuple issues** - Pay attention to exact type requirements
- ❌ **Missing Effect imports** - Import all necessary Effect modules
- ❌ **Outdated patterns** - Use current Effect API, not deprecated approaches
- ❌ **Missing Schema import** - Always import Schema when using schema functions
- ❌ **Incorrect validation patterns** - Use `decodeUnknownSync` for sync validation, `decodeUnknownEffect` for async

## Code Style Guidelines

### TypeScript Quality Standards

- **Type Safety**: NEVER use `any` type or `as any` assertions
- **Explicit Types**: Use concrete types over generic `unknown` where possible
- **Type Annotations**: Add explicit annotations when inference fails
- **Early Returns**: Prefer early returns for better readability
- **Input Validation**: Validate all inputs at boundaries
- **Error Handling**: Use proper Effect error management patterns

### Effect Library Conventions

- Follow existing TypeScript patterns in the codebase
- Use functional programming principles
- Maintain consistency with Effect library conventions
- Use proper Effect constructors (e.g., `Array.make()`, `Chunk.fromIterable()`)
- Prefer `Effect.gen` for monadic composition
- Use `Data.TaggedError` for custom error types
- Implement resource safety with automatic cleanup patterns

### Logging and Tracing

**Keep it minimal:**
- Only log errors, not start/complete/debug noise
- Log errors once at the operation level with `Effect.tapError` before `mapError`
- Add logging at the service level (e.g., Database), not at call sites
- Use spans for tracing: `Effect.withSpan("operation.name")`
- Annotate spans with useful metadata: `Effect.annotateCurrentSpan({ id, count })`
- Annotate logs with context: `Effect.annotateLogs({ service: "ServiceName", id })`
- Don't add redundant attributes to spans (e.g., `{ operation: "search" }` when span is named "search")

### Code Organization

- No comments unless explicitly requested
- Follow existing file structure and naming conventions
- Delete old code when replacing functionality
- **NEVER create new script files or tools unless explicitly requested by the user**
- Choose clarity over cleverness in all implementations

### Implementation Completeness

Code is considered complete only when:

- All linters pass (`bun run lint`)
- All tests pass (`bun run test`) if applicable
- All type checks pass (`bun run check`)
- Feature works end-to-end
- Old/deprecated code is removed

## Key Directories

### Configuration & Specs

- `.patterns/` - Development patterns and best practices
  - `effect-usage.md` - Core Effect patterns
  - `error-handling.md` - Structured error management patterns

### Source Code References

- `vendor/effect/` - Complete Effect-TS source repository (gitignored)
  - Available for exploring implementation details, internal types, and advanced patterns
  - When online docs are insufficient, explore the source code directly
  - Main packages are in `vendor/effect/packages/` (effect, schema, platform, etc.)
  - Update with: `cd vendor/effect && git pull`

## Development Patterns Reference

The `.patterns/` directory contains comprehensive development patterns and best practices for the Effect library. **Always reference these patterns before implementing new functionality** to ensure consistency with established codebase conventions.

### Core Patterns to Follow:

- **Effect TS Development**: Fundamental patterns, forbidden practices, and mandatory patterns
- **Module Organization**: Directory structure, export patterns, naming conventions, and TypeId usage
- **Error Handling**: Data.TaggedError usage, error transformation, and recovery patterns
- **Platform Integration**: Service abstractions, layer composition, and cross-platform patterns

## Problem-Solving Strategies

### When Encountering Complex Issues

1. **Stop and Analyze**: Don't spiral into increasingly complex solutions
2. **Break Down**: Divide complex problems into smaller, manageable parts
3. **Use Parallel Approaches**: Launch multiple Task agents for different aspects
4. **Research First**: Always understand existing patterns before creating new ones
5. **Validate Frequently**: Use reality checkpoints to ensure you're on track
6. **Simplify**: Choose the simplest solution that meets requirements
7. **Ask for Help**: Request guidance rather than guessing

### Effective Task Management

- Use TodoWrite/TodoRead tools for complex multi-step tasks
- Mark tasks as in_progress before starting work
- Complete tasks immediately upon finishing
- Break large tasks into smaller, trackable components

## Performance Considerations

- **Measure First**: Always measure performance before optimizing
- Prefer eager evaluation patterns where appropriate
- Consider memory usage and optimization
- Follow established performance patterns in the codebase
- Prioritize clarity over premature optimization
- Use appropriate data structures for the use case
- Claude NEVER runs the dev server, the user already has it running

