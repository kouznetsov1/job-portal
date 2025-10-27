# Quick Wins for Tomorrow

## Immediate Next Steps (30 minutes)

### 1. Make userId Nullable
```bash
# Edit: packages/db/src/prisma/models/chat.prisma
userId    String?  # Change to nullable

# Edit: apps/server/src/services/prisma-persistence.ts
userId: null,  # Line 51 and similar

# Push changes
bunx --cwd packages/db prisma db push
bunx --cwd packages/db prisma generate
```

### 2. Test the Chat Flow
1. Open http://localhost:3000/chat
2. Type a message
3. Should see AI response streaming back
4. Check that it persists (send another message, should have context)

### 3. Check What Works
```sql
-- In your database
SELECT * FROM "Chat";
-- Should see entries with promptHistory JSON
```

## If That Works, Next Steps

### Option A: Add Basic Auth (1 hour)
```typescript
// In chat handler, extract session
const session = yield* Auth.getSession(request);
if (!session) {
  return yield* Effect.fail(new AIChatError({ message: "Login required" }));
}

// Use real userId
userId: session.user.id
```

### Option B: Improve Chat UX (1 hour)
- Add loading indicator
- Better error messages
- Show chat history on page load
- Allow creating new chats

### Option C: Build Chat List (1 hour)
- New RPC: `chat.list`
- Show all user's chats
- Click to resume chat
- Delete old chats

## Long-term TODOs

### Architecture Decisions
- [ ] Decide if we keep @effect/ai persistence or build custom
- [ ] Design multi-user chat sharing model
- [ ] Plan for chat metadata (titles, tags, etc.)

### Features
- [ ] System prompts (customize AI behavior per chat)
- [ ] Tool calling (let AI search jobs, generate CVs, etc.)
- [ ] Export chat history
- [ ] Chat templates

### Infrastructure
- [ ] Proper error handling in streams
- [ ] Rate limiting per user
- [ ] Cost tracking (OpenAI tokens)
- [ ] Observability (tracing, metrics)

## Files Reference

### Need to Change
- `packages/db/src/prisma/models/chat.prisma` - Make userId optional
- `apps/server/src/services/prisma-persistence.ts` - Use null for userId

### May Need to Change
- `apps/server/src/domains/chat.ts` - Add auth extraction
- `apps/dashboard/src/routes/(app)/chat.tsx` - Improve UX

### Don't Touch (Generated)
- `packages/db/src/generated/prisma/*` - Auto-generated
- `node_modules/@effect/*` - Dependencies

## Testing Checklist

### Basic Functionality
- [ ] Chat page loads
- [ ] Can type message
- [ ] Message sends to backend
- [ ] AI response streams back
- [ ] Response renders in UI
- [ ] Can send multiple messages
- [ ] Context is maintained (AI remembers previous messages)

### Error Handling
- [ ] What happens if OpenAI API is down?
- [ ] What happens if message is empty?
- [ ] What happens if network disconnects mid-stream?

### Database
- [ ] Chat is saved to database
- [ ] promptHistory JSON is valid
- [ ] Can query chats with SQL
- [ ] Expired chats are cleaned up (if TTL works)

## Success Criteria

**MVP is working when:**
1. ✅ User can send messages
2. ✅ AI responds with streaming
3. ✅ Conversation history is maintained
4. ✅ Data persists in database

**Production-ready when:**
1. ✅ Auth is required
2. ✅ Users see only their chats
3. ✅ Good error handling
4. ✅ Rate limiting
5. ✅ Cost monitoring

## Common Issues & Fixes

### "Service not found: HttpClient"
**Fix:** Added FetchHttpClient.layer to OpenAiLanguageModelLayer

### "PersistenceError: BackingError"
**Fix:** Make userId nullable OR create test user

### "Invalid Date" in database
**Fix:** Validate dates before saving (unrelated to chat)

### Stream doesn't close
**Fix:** Check that response parts are properly filtered

### Frontend shows raw object instead of text
**Fix:** Map stream chunks to .content field

## Environment Variables

Make sure these are set in `.env`:
```bash
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
```

## Useful Commands

```bash
# Check database
bunx --cwd packages/db prisma studio

# View server logs
# (Check tmux window 2)

# Type check
bun run type-check

# Restart dev server
# Ctrl+C in tmux, then bun run dev

# View chat table
psql $DATABASE_URL -c "SELECT id, \"userId\", \"createdAt\" FROM \"Chat\";"
```
