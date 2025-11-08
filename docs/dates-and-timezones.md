# Dates and Timezones

## Design Decision

Use `Schema.Date` throughout the application.

## Storage

- **Database**: Always store as UTC (`TIMESTAMP` in Postgres)
- **Prisma**: Use `DateTime` type
- **Domain schemas**: Use `Schema.Date`

```prisma
model User {
  createdAt DateTime @default(now())
}
```

```typescript
export class UserPublic extends Schema.Class<UserPublic>("UserPublic")({
  createdAt: Schema.Date,
}) {}
```

## Flow

1. **Database**: UTC timestamp
2. **Prisma returns**: JavaScript `Date` object (UTC internally)
3. **Schema.Date**: Validates and serializes to ISO string in JSON
4. **Frontend**: Receives ISO string, converts to local timezone for display

## Display on Frontend

```typescript
import { formatRelative } from 'date-fns'

// Automatic local timezone conversion
formatRelative(new Date(user.createdAt), new Date())
// "2 hours ago" in user's timezone
```

## Querying by Date

### The Problem

User picks "Nov 8, 2024" in their timezone (GMT+2). That's "2024-11-07T22:00:00Z" in UTC. Naive queries miss results.

### Solution: Convert to UTC Range

```typescript
// User input: "2024-11-08" (local date)
const userDate = new Date("2024-11-08")

// Convert to UTC day range
const startOfDay = new Date(userDate.setUTCHours(0, 0, 0, 0))
const endOfDay = new Date(userDate.setUTCHours(23, 59, 59, 999))

// Query
prisma.job.findMany({
  where: {
    createdAt: { gte: startOfDay, lte: endOfDay }
  }
})
```

### With Effect Schema Transform

```typescript
export const DateRangeQuery = Schema.transform(
  Schema.Date,
  Schema.Struct({
    gte: Schema.Date,
    lte: Schema.Date,
  }),
  {
    decode: (date) => ({
      gte: new Date(date.setUTCHours(0, 0, 0, 0)),
      lte: new Date(date.setUTCHours(23, 59, 59, 999)),
    }),
    encode: ({ gte }) => gte,
  }
)

// In your RPC schema
Schema.Struct({
  createdOn: Schema.optional(DateRangeQuery),
})

// Client sends: { createdOn: new Date("2024-11-08") }
// Auto-transforms to: { createdOn: { gte: ..., lte: ... } } in UTC
// Query: prisma.job.findMany({ where: { createdAt: input.createdOn } })
```

## Golden Rule

**Store UTC, display local, query with UTC ranges.**
