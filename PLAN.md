# Plan

## Tomorrow (2025-10-27)

### Priority: PDF Generation with Typst + AI Integration

1. Review chat implementation PR
   - Understand OpenAI streaming integration with NDJSON protocol
   - Review AI service architecture and chat domain schemas
   - Understand how chat UI communicates with backend

2. Create Typst compiler service for PDFs
   - Set up Typst CLI integration as Effect service
   - Implement compilation from Typst source to PDF
   - Add proper error handling and resource management
   - Test basic PDF generation

3. Integrate AI and Typst for chat-based PDF generation
   - Create AI agent that generates Typst markup
   - Connect chat interface to Typst compilation service
   - Implement streaming workflow: prompt → AI → Typst → PDF
   - Add proper error handling and user feedback
