# Authentication Implementation Plan

## Current State

### What Works
- ✅ Better Auth configured with HTTP-only cookies
- ✅ Frontend auth client in `apps/dashboard/src/lib/auth.ts`
- ✅ Backend Auth service in `packages/auth/src/auth.ts`
- ✅ Browser automatically sends cookies with requests
- ✅ `Auth.getSession(request)` can validate session from headers

### What's Missing
- ❌ RPC handlers don't extract/validate session yet
- ❌ No way to pass userId to services that need it
- ❌ Chat persistence requires userId but can't get it

## Implementation Options

### Option A: RPC Middleware (Complex but Clean)

Based on Effect RPC patterns from vendor source.

#### Step 1: Define Middleware Tag
```typescript
// packages/domain/src/middleware/auth-middleware.ts
import { RpcMiddleware } from "@effect/rpc";
import { Context, Schema } from "effect";

export class AuthenticatedUser extends Context.Tag("AuthenticatedUser")<
  AuthenticatedUser,
  { userId: string; email: string }
>() {}

export class AuthenticationError extends Schema.TaggedError<AuthenticationError>()(
  "AuthenticationError"
)<{ message: string }> {}

export class AuthMiddleware extends RpcMiddleware.Tag<AuthMiddleware>()(
  "AuthMiddleware",
  {
    provides: AuthenticatedUser,
    failure: AuthenticationError,
    requiredForClient: true,
  }
) {}
```

#### Step 2: Add to RPC Definitions
```typescript
// packages/domain/src/domains/chat.ts
export const ChatRpcs = RpcGroup.make(
  Rpc.make("chat.stream", {
    payload: ChatRequest,
    success: ChatStreamChunk,
    error: AIChatError,
    stream: true,
  }).middleware(AuthMiddleware),  // ← Add here
);
```

#### Step 3: Implement Server-Side Middleware
```typescript
// apps/server/src/middleware/auth-middleware.ts
export const AuthMiddlewareLive = Layer.succeed(
  AuthMiddleware,
  AuthMiddleware.of((options) =>
    Effect.gen(function* () {
      const auth = yield* Auth;

      const request = new Request("http://internal", {
        headers: options.headers,
      });

      const session = yield* Auth.requireAuth(request);

      return {
        userId: session.user.id,
        email: session.user.email,
      };
    })
  )
);
```

#### Step 4: Use in Handlers
```typescript
// apps/server/src/domains/chat.ts
"chat.stream": (params) =>
  Effect.gen(function* () {
    const user = yield* AuthenticatedUser;  // ← Available!
    // ... use user.userId
  })
```

**Pros:**
- Type-safe
- Follows Effect patterns
- Automatic injection into handlers

**Cons:**
- Complex setup
- Still doesn't solve BackingPersistence issue
- Middleware runs per-request, persistence is global

---

### Option B: Direct Header Extraction (Simple)

Extract session directly in RPC handler.

```typescript
// apps/server/src/domains/chat.ts
export const ChatLiveHandler = ChatRpcs.toLayer(
  Effect.gen(function* () {
    const persistence = yield* Chat.Persistence;
    const auth = yield* Auth;

    return {
      "chat.stream": (params, options) =>
        Effect.gen(function* () {
          // Extract session from headers
          const request = new Request("http://internal", {
            headers: options.headers,
          });

          const session = yield* auth.getSession(request);
          if (!session) {
            return yield* Effect.fail(
              new AIChatError({ message: "Autentisering krävs" })
            );
          }

          const userId = session.user.id;
          const chatId = params.chatId ?? generateChatId();

          // Now what? How to pass userId to persistence?
          const chat = yield* persistence.getOrCreate(chatId);

          return chat.streamText({ prompt: params.message });
        }),
    };
  }),
).pipe(
  Layer.provide(Chat.layerPersisted({ storeId: "chats" })),
  Layer.provide(PrismaPersistenceLayer),
  Layer.provide(OpenAiLanguageModelLayer),
  Layer.provide(Auth.Live),  // ← Add Auth
);
```

**Pros:**
- Simple, direct
- No new abstractions

**Cons:**
- Still doesn't solve how to get userId to BackingPersistence.set()
- Duplicated auth logic across handlers

---

### Option C: Custom Chat Service (Pragmatic)

Don't use @effect/ai's persistence, manage it ourselves.

```typescript
// apps/server/src/services/user-chat-service.ts
export class UserChatService extends Effect.Service<UserChatService>()(
  "UserChatService",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database;

      const getOrCreateChat = (userId: string, chatId: string) =>
        Effect.gen(function* () {
          // Load from DB with userId
          const existing = yield* db.use((p) =>
            p.chat.findUnique({
              where: { id: chatId, userId },
            })
          );

          if (existing) {
            // Restore Chat from JSON
            return yield* Chat.fromJson(existing.promptHistory as string);
          }

          // Create new
          const chat = yield* Chat.empty;

          // Save to DB with userId
          yield* db.use((p) =>
            p.chat.create({
              data: {
                id: chatId,
                userId,
                promptHistory: yield* chat.exportJson,
              },
            })
          );

          return chat;
        });

      return { getOrCreateChat };
    }),
  }
) {}
```

**Usage:**
```typescript
"chat.stream": (params, options) =>
  Effect.gen(function* () {
    const userChatService = yield* UserChatService;
    const session = yield* getSession(options.headers);

    const chat = yield* userChatService.getOrCreateChat(
      session.user.id,
      params.chatId ?? generateChatId()
    );

    // Stream response
    const response = yield* chat.streamText({ prompt: params.message });

    // Save after streaming
    yield* saveChat(session.user.id, chat);

    return response;
  })
```

**Pros:**
- Full control over userId
- No impedance mismatch
- Clear ownership model

**Cons:**
- Lose @effect/ai's auto-save feature
- More code to maintain
- Have to manually manage save timing

---

## Recommended Approach

### Tonight: Option B (Quick Fix)
1. Make userId nullable
2. Extract session in handler
3. Set userId: null in persistence
4. **Goal:** Get chat working end-to-end

### Tomorrow: Decide Between
- **Option C** if we want full control and flexibility
- **Option A** if we want to stay idiomatic with Effect patterns

### Criteria for Decision
1. How often will we need userId in different handlers?
2. Do we want chat history to be shareable/collaborative?
3. How important is the auto-save feature of @effect/ai?

## Implementation Checklist

### Phase 1: Testing (No Auth)
- [ ] Make Chat.userId nullable in Prisma
- [ ] Push schema changes
- [ ] Update persistence to use userId: null
- [ ] Test: Send message → Get AI response
- [ ] Verify: Stream works, history saves

### Phase 2: Authentication
- [ ] Choose approach (A, B, or C)
- [ ] Implement session extraction
- [ ] Update persistence to use real userId
- [ ] Test: Logged-in user can chat
- [ ] Test: Logged-out user gets error

### Phase 3: Multi-User
- [ ] List user's chats
- [ ] Resume existing chat
- [ ] Prevent access to other users' chats
- [ ] Add chat metadata (title, created date, etc.)

## Open Questions

1. **Should chats be scoped per-user or global with access control?**
   - Per-user: Simple, chatId = user_xxx_chat_yyy
   - Access control: Flexible, supports sharing

2. **How do we want to identify chats on the frontend?**
   - Random ID: Need to show list of chats
   - Named: "My Resume Chat", "Job Search Assistant"

3. **Do we need chat history persistence at all for MVP?**
   - Could start with in-memory chats
   - Add persistence when patterns are clear
