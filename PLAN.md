# Plan

## Tomorrow (2025-10-28)

### Priority: Fix Chat Migration Issues

1. Fix userId persistence issue
   - Make Chat.userId nullable in Prisma schema (temporary solution)
   - Update PrismaPersistence to use `userId: null`
   - Push schema changes and regenerate Prisma client
   - Test that chat saves to database without errors

2. Verify end-to-end chat functionality
   - Test message sending from frontend
   - Verify AI streaming responses work correctly
   - Check that conversation history is maintained across messages
   - Confirm chat persists to database with promptHistory JSON

3. Implement authentication for chat
   - Decide on auth approach (middleware vs direct extraction)
   - Extract session from RPC handler headers
   - Pass real userId to persistence layer
   - Test that authenticated users can create and access their chats

4. Clean up and remove old dependencies
   - Remove old AIService using Vercel AI SDK
   - Remove `ai` and `@ai-sdk/openai` packages if no longer needed
   - Update any remaining references

## Future: PDF Generation with Typst + AI Integration

1. Create Typst compiler service for PDFs
   - Set up Typst CLI integration as Effect service
   - Implement compilation from Typst source to PDF
   - Add proper error handling and resource management

2. Integrate AI and Typst for chat-based PDF generation
   - Create AI agent that generates Typst markup
   - Connect chat interface to Typst compilation service
   - Implement streaming workflow: prompt → AI → Typst → PDF
