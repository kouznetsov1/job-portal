# Chat Migration to @effect/ai - Analysis & Issues

## Date: 2025-10-27

## What We Accomplished Today

### ✅ Completed
1. Created Prisma Chat model schema
2. Implemented PrismaPersistence BackingPersistence layer
3. Created OpenAI LanguageModel layer with FetchHttpClient
4. Updated chat domain RPC schemas (added chatId, ChatStreamChunk)
5. Updated RPC handlers to use Chat.Persistence
6. Updated frontend to work with new response format (.content instead of raw string)
7. Pushed Chat schema to database

### 🟡 Partially Complete
- Server starts and chat attempts to work
- Gets "BackingError" because userId is required but we can't provide it yet

## The Core Problem: userId and Persistence Context

### Architecture Mismatch

**@effect/ai's BackingPersistence interface:**
```typescript
interface BackingPersistenceStore {
  get(key: string): Effect<Option<unknown>, Error>
  set(key: string, value: unknown, ttl: Option<Duration>): Effect<void, Error>
  remove(key: string): Effect<void, Error>
  clear: Effect<void, Error>
}
```

**Our database needs:**
```sql
CREATE TABLE "Chat" (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,  -- ❌ Where does this come from?
  promptHistory JSONB,
  ...
)
```

### The Issue

1. **BackingPersistence is created at app startup** (via `Layer.effect`)
   - Lives for the entire app lifetime
   - No access to per-request context

2. **userId comes from the session** (per-request)
   - Extracted from HTTP headers/cookies
   - Changes for every request

3. **No clean way to pass userId to persistence**
   - The interface doesn't support it
   - Can't access Effect Context from BackingPersistence

## Authentication Flow (What We Discovered)

### Frontend (TanStack Start + Better Auth)
- Better Auth client in `apps/dashboard/src/lib/auth.ts`
- HTTP-only cookies store session
- Browser automatically includes cookies in all requests
- No manual header injection needed!

### Backend (Effect + Better Auth)
- Auth service in `packages/auth/src/auth.ts`
- `Auth.getSession(request)` - Validate session from headers
- `Auth.requireAuth(request)` - Require authentication

### RPC Headers Flow
```typescript
// RPC handlers receive headers in options
"chat.stream": (params, options) => {
  // options.headers contains cookies
  const request = new Request("http://internal", {
    headers: options.headers
  });

  const session = yield* Auth.requireAuth(request);
  // Now we have session.user.id

  // But how do we get it to BackingPersistence.set()?
}
```

## Possible Solutions

### Option 1: Encode userId in chatId ⚠️
```typescript
const chatId = `user_${userId}_chat_${randomId()}`;
// Extract userId when persisting
```
**Pros:** Simple, works with existing interface
**Cons:** Hacky, couples domain logic to infrastructure

### Option 2: Make userId Nullable ✅
```typescript
model Chat {
  userId String?  // Nullable for now
}

// In persistence:
create: {
  id: chatId,
  userId: null,  // TODO: Fix later
  promptHistory: value
}
```
**Pros:** Unblocks testing, simple
**Cons:** Not the final solution, technical debt

### Option 3: Custom Chat Implementation 🔧
Don't use @effect/ai's Chat.Persistence:
```typescript
class OurChat {
  constructor(userId: string, chatId: string) { ... }
  streamText: ...
  save: ...  // Has access to userId
}
```
**Pros:** Full control, proper architecture
**Cons:** More code, bypasses @effect/ai benefits

### Option 4: Effect Context for CurrentUser 🤔
```typescript
class CurrentUser extends Context.Tag("CurrentUser")<
  CurrentUser,
  { userId: string }
>() {}

// Provide per-request in RPC handler
// Access in persistence layer
```
**Pros:** Clean, Effect-ish pattern
**Cons:** BackingPersistence layer created at startup, not per-request

### Option 5: Metadata/Association Table 💡
```typescript
// Store userId separately
model Chat {
  id String @id
  userId String?  // Can be null
  promptHistory Json
}

model ChatAccess {
  chatId String
  userId String
  role String  // owner, viewer, etc.
  @@id([chatId, userId])
}
```
**Pros:** Flexible, supports sharing
**Cons:** Extra complexity, need to sync

## Recommended Approach

### Phase 1: Get It Working (Tonight/Tomorrow)
1. Make `userId` nullable in Prisma schema
2. Set `userId: null` in PrismaPersistence
3. Test full flow: frontend → RPC → Chat → OpenAI → stream back
4. Verify everything works except user association

### Phase 2: Add Authentication (Next Session)
1. Implement auth middleware pattern OR
2. Pass userId through chatId encoding OR
3. Build custom Chat wrapper that knows about users

### Phase 3: Production Ready (Future)
1. Add proper multi-user support
2. Chat listing: "show me my chats"
3. Security: users can only access their chats
4. Consider if we need @effect/ai persistence or roll our own

## Key Files

### Created/Modified
- `packages/db/src/prisma/models/chat.prisma` - Chat schema
- `apps/server/src/services/prisma-persistence.ts` - Prisma BackingPersistence
- `apps/server/src/services/openai-language-model.ts` - OpenAI layer with HttpClient
- `packages/domain/src/domains/chat.ts` - RPC schemas with chatId
- `apps/server/src/domains/chat.ts` - RPC handler using Chat.Persistence
- `apps/dashboard/src/routes/(app)/chat.tsx` - Frontend updated for new format

### Need Attention
- `apps/server/src/services/prisma-persistence.ts:51` - `userId: "user_placeholder"` needs fix
- `packages/db/src/prisma/models/chat.prisma:3` - `userId String` should be `String?` for testing

## Error We're Currently Seeing

```
PersistenceError: BackingError
```

**Cause:** Trying to insert Chat with `userId: "user_placeholder"` which doesn't exist in User table.

**Quick Fix:** Make userId nullable OR create a test user with that ID.

## Next Steps (Tomorrow)

1. ✅ Decide on approach (probably Option 2: nullable userId)
2. Update Prisma schema + push migration
3. Test chat flow end-to-end
4. Document what works and what needs auth
5. Plan Phase 2 implementation

## Questions to Answer

1. **Do we need @effect/ai's persistence?**
   - Pros: Automatic history management, TTL support
   - Cons: Doesn't fit our multi-user model cleanly

2. **Should chats be user-specific or shareable?**
   - Impacts schema design (userId vs association table)

3. **How important is chat history persistence?**
   - Could start with in-memory (Chat.empty)
   - Add persistence later when patterns are clear

## Resources

- Auth patterns documented by Explore agent in terminal output
- @effect/ai vendor source in `vendor/effect/packages/ai/`
- RPC middleware patterns in `vendor/effect/packages/platform-node/test/fixtures/`
