# Searcha - Architecture & Implementation Guide

Complete architecture for Searcha, a Swedish job search platform with AI-powered application generation.

## Table of Contents

1. [Overview](#overview)
2. [Phase 0: Interface Definition & Service Structure](#phase-0-interface-definition--service-structure)
3. [Phase 1: Core User & Auth](#phase-1-core-user--auth)
4. [Phase 2: Profile & CV Management](#phase-2-profile--cv-management)
5. [Phase 3: Embeddings & Matching](#phase-3-embeddings--matching)
6. [Phase 4: Onboarding Chat](#phase-4-onboarding-chat)
7. [Phase 5: Application Generation](#phase-5-application-generation)
8. [Phase 6: Company Pages & SEO](#phase-6-company-pages--seo)
9. [Phase 7: Frontend Implementation](#phase-7-frontend-implementation)
10. [Database Schema Reference](#database-schema-reference)

---

## Overview

### Architecture Principles

- **Service-Oriented RPC Groups**: Each domain has its own RPC group and service
- **Effect-First**: All services use Effect for error handling, dependency injection, and composition
- **Schema-Driven**: Effect Schema defines all data structures and validation
- **Separation of Concerns**: Domain interfaces in `packages/domain`, implementations in `apps/server`

### Monorepo Structure

```
packages/
  domain/          # RPC interfaces, schemas, errors (shared)
  db/              # Prisma client, database service
  ui/              # shadcn components (shared)
  auth/            # Better Auth setup

apps/
  server/          # Effect RPC handlers + services
  web/             # SSR/SEO public site (searcha.se)
  dashboard/       # Client SPA (app.searcha.se)
```

---

## Phase 0: Interface Definition & Service Structure

**Goal**: Define all RPC interfaces, schemas, and service contracts WITHOUT implementing them.

### 0.1: Define User Domain

**File**: `packages/domain/src/domains/users.ts`

**Note**: Better Auth handles signup/signin/signout client-side via its own endpoints. We only need RPCs for fetching/updating user data.

#### Schemas

- [x] Create `UserPublic` schema (id, email, name, createdAt)

#### Errors

- [x] Create `UserNotFoundError` with userId field
- [x] Create `UserRpcError` union (UserNotFoundError, SessionNotFoundError)

#### RPC Interface

- [x] Create `UsersRpcs` class extending RpcGroup
- [x] Add `users.getCurrentUser` RPC (success: UserPublic, error: UserRpcError)

---

### 0.2: Define Profile Domain

**File**: `packages/domain/src/schema/profile.ts`

#### Schemas

- [x] Create `Experience` schema (id, title, company, startDate, endDate, description, current)
- [x] Create `Education` schema (id, institution, degree, field, startDate, endDate, current)
- [x] Create `UserProfile` schema with all fields (fullName, email, phone, headline, summary, skills[], experience[], education[], cvFileUrl, linkedinUrl, timestamps)
- [x] Create `UpdateProfileData` schema (partial of UserProfile fields)
- [x] Create `CVUploadRequest` schema (fileName, fileData base64, mimeType)
- [x] Create `ParsedCVResult` schema (text)

#### Errors

- [x] Create `ProfileNotFoundError` with userId field
- [x] Create `CVParseError` with message field
- [x] Create `ProfileRpcError` union (ProfileNotFoundError, CVParseError, DatabaseError)

#### RPC Interface

- [x] Create `ProfilesRpcs` class extending RpcGroup
- [x] Add `profiles.get` RPC (success: UserProfile, error: ProfileRpcError)
- [x] Add `profiles.update` RPC (payload: UpdateProfileData, success: UserProfile, error: ProfileRpcError)
- [x] Add `profiles.uploadCV` RPC (payload: CVUploadRequest, success: ParsedCVResult, error: ProfileRpcError)

---

### 0.3: Update Jobs Domain for Matching

**File**: `packages/domain/src/schema/job.ts`

**Note**: Matching is NOT a separate RPC domain - it's just optional fields on job search results calculated on-the-fly.

NOTE: The old job domain spec has been deleted so we have to make it from scratch. Please analyze the prisma schema for this.

#### Add to JobSearchParams schema

- [x] Add optional `minMatchScore` field (number 0-100)
- [x] Add optional `maxMatchScore` field (number 0-100)
- [x] Add optional `sortByMatch` field (boolean)

#### Add to Job schema (calculated fields when user authenticated)

- [x] Add optional `matchScore` field (number 0-100) - cosine similarity score
- [x] Add optional `matchReasons` field (string[]) - AI-generated reasons for match

**Note**: matchScore calculated using: job.aiSummaryEmbedding <=> user.perfectJobEmbedding

---

### 0.4: Define CV Templates Domain

**File**: `packages/domain/src/schema/cv-template.ts`

**Note**: CV templates are SYSTEM templates created by Searcha, NOT user-created. Users can only view and select templates.

#### Schemas

- [x] Create `CVTemplate` schema (id, name, description, typstCode text, createdAt, updatedAt)

#### Errors

- [x] Create `TemplateNotFoundError` with templateId field
- [x] Create `TemplateRpcError` union (TemplateNotFoundError, DatabaseError)

#### RPC Interface

- [x] Create `CVTemplatesRpcs` class extending RpcGroup
- [x] Add `cvTemplates.list` RPC (success: CVTemplate[], error: TemplateRpcError) - get all system templates
- [x] Add `cvTemplates.get` RPC (payload: {templateId}, success: CVTemplate, error: TemplateRpcError)
- [x] Add `cvTemplates.setActive` RPC (payload: {templateId}, success: Boolean, error: TemplateRpcError) - set user's active template

**Note**: No create/update/delete RPCs - templates are managed by Searcha via database seeds.

---

### 0.5: Define CV Editor Domain

**File**: `packages/domain/src/schema/cv-editor.ts`

#### Schemas

- [x] Create `CVEditorChat` schema (id, userId, typstCode text, messages[], createdAt, updatedAt)
- [x] Create `CVChatMessage` schema (id, chatId, role: user|assistant, content, createdAt)
- [x] Create `SendCVChatMessageRequest` schema (message)
- [x] Create `CVChatStreamChunk` schema (content, done boolean, optional updatedTypstCode)
- [x] Create `CompileCVRequest` schema (typstCode)
- [x] Create `CompiledCVResult` schema (pdfData base64, success boolean, optional errors)

#### Errors

- [x] Create `CVEditorError` with message field
- [x] Create `CVCompilationError` with message and errors fields
- [x] Create `CVEditorRpcError` union (CVEditorError, CVCompilationError, DatabaseError)

#### RPC Interface

- [x] Create `CVEditorRpcs` class extending RpcGroup
- [x] Add `cvEditor.getOrCreateChat` RPC (success: {chat, messages}, error: CVEditorRpcError)
- [x] Add `cvEditor.sendMessage` RPC (payload: SendCVChatMessageRequest, success: CVChatStreamChunk, error: CVEditorRpcError, stream: true)
- [x] Add `cvEditor.updateTypstCode` RPC (payload: {typstCode}, success: Boolean, error: CVEditorRpcError)
- [x] Add `cvEditor.compile` RPC (payload: CompileCVRequest, success: CompiledCVResult, error: CVEditorRpcError)

---

### 0.6: Define Onboarding Domain

**File**: `packages/domain/src/schema/onboarding.ts`

#### Schemas

- [x] Create `OnboardingChat` schema (id, userId, status: active|completed|abandoned, createdAt, completedAt)
- [x] Create `ChatMessage` schema (id, chatId, role: user|assistant, content, createdAt)
- [x] Create `SendMessageRequest` schema (chatId, message)
- [x] Create `ChatStreamChunk` schema (content, done boolean)
- [x] Create `UploadCVToOnboardingRequest` schema (chatId, fileName, fileData, mimeType)
- [x] Create `CompleteOnboardingRequest` schema (chatId)

#### Errors

- [x] Create `OnboardingChatNotFoundError` with chatId field
- [x] Create `OnboardingError` with message field
- [x] Create `OnboardingRpcError` union (OnboardingChatNotFoundError, OnboardingError, DatabaseError)

#### RPC Interface

- [x] Create `OnboardingRpcs` class extending RpcGroup
- [x] Add `onboarding.start` RPC (success: OnboardingChat, error: OnboardingRpcError)
- [x] Add `onboarding.sendMessage` RPC (payload: SendMessageRequest, success: ChatStreamChunk, error: OnboardingRpcError, stream: true)
- [x] Add `onboarding.uploadCV` RPC (payload: UploadCVToOnboardingRequest, success: {success, message}, error: OnboardingRpcError)
- [x] Add `onboarding.complete` RPC (payload: CompleteOnboardingRequest, success: UserProfile, error: OnboardingRpcError)
- [x] Add `onboarding.getChat` RPC (payload: {chatId}, success: {chat, messages[]}, error: OnboardingRpcError)

---

### 0.7: Define Applications Domain

**File**: `packages/domain/src/schema/application.ts`

#### Schemas

- [x] Create `Application` schema (id, userId, jobId, job, generatedCvText, generatedLetterText, companyResearchNotes, status: draft|applied|archived, createdAt, appliedAt)
- [x] Create `GenerateApplicationRequest` schema (jobId)
- [x] Create `GenerationProgress` schema (stage enum, message, progress 0-100, done boolean, optional applicationId)
- [x] Add stage enum: researching_company, analyzing_job, generating_cv, generating_letter, finalizing, complete
- [x] Create `RegenerateApplicationRequest` schema (applicationId, optional feedback)
- [x] Create `DownloadApplicationRequest` schema (applicationId, format: pdf|docx)
- [x] Create `DownloadApplicationResult` schema (fileName, fileData base64, mimeType)
- [x] Create `MarkAppliedRequest` schema (applicationId)

#### Errors

- [x] Create `ApplicationNotFoundError` with applicationId field
- [x] Create `ApplicationGenerationError` with message field
- [x] Create `ApplicationRpcError` union (ApplicationNotFoundError, ApplicationGenerationError, DatabaseError)

#### RPC Interface

- [x] Create `ApplicationsRpcs` class extending RpcGroup
- [x] Add `applications.generate` RPC (payload: GenerateApplicationRequest, success: GenerationProgress, error: ApplicationRpcError, stream: true)
- [x] Add `applications.get` RPC (payload: {applicationId}, success: Application, error: ApplicationRpcError)
- [x] Add `applications.list` RPC (success: Application[], error: ApplicationRpcError)
- [x] Add `applications.regenerate` RPC (payload: RegenerateApplicationRequest, success: GenerationProgress, error: ApplicationRpcError, stream: true)
- [x] Add `applications.download` RPC (payload: DownloadApplicationRequest, success: DownloadApplicationResult, error: ApplicationRpcError)
- [x] Add `applications.markApplied` RPC (payload: MarkAppliedRequest, success: Application, error: ApplicationRpcError)

---

### 0.8: Define Companies Domain

**File**: `packages/domain/src/schema/company.ts`

**Note**: Company enrichment (scraping, AI description) happens automatically during job sync for NEW companies only. NOT an RPC endpoint.

#### Schemas

- [x] Create `CompanyDetailed` schema (id, name, slug, organizationNumber, website, logo, description, aiDescription text, industry, size, socialMedia json, scrapedData json, lastEnriched, jobCount, timestamps)
- [x] Create `CompanySearchParams` schema (optional q, industry, minSize, maxSize, page, pageSize)
- [x] Create `CompanySearchResult` schema (companies[], total, page, pageSize)
- [x] Create `CompanyJobsRequest` schema (companyId, optional page, pageSize)
- [x] Create `CompanyJobsResult` schema (company: CompanyDetailed, jobs[], total)

#### Errors

- [x] Create `CompanyNotFoundError` with companyId field
- [x] Create `CompanyRpcError` union (CompanyNotFoundError, DatabaseError)

#### RPC Interface

- [x] Create `CompaniesRpcs` class extending RpcGroup
- [x] Add `companies.search` RPC (payload: CompanySearchParams, success: CompanySearchResult, error: CompanyRpcError)
- [x] Add `companies.getById` RPC (payload: {id}, success: CompanyDetailed, error: CompanyRpcError)
- [x] Add `companies.getJobs` RPC (payload: CompanyJobsRequest, success: CompanyJobsResult, error: CompanyRpcError)

---

### 0.9: Extend Jobs Domain (Saved Jobs)

**File**: `packages/domain/src/rpcs/job.ts`

- [x] Add `jobs.getSaved` RPC to existing JobsRpcs (success: Job[], error: JobRpcError)
- [x] Add `jobs.save` RPC (payload: {jobId}, success: Boolean, error: JobRpcError)
- [x] Add `jobs.unsave` RPC (payload: {jobId}, success: Boolean, error: JobRpcError)
- [x] Add `jobs.isSaved` RPC (payload: {jobId}, success: Boolean, error: JobRpcError)

---

### 0.10: Merge All RPC Groups

**File**: `packages/domain/src/rpcs/index.ts`

- [x] Import HealthRpcs, JobsRpcs, UsersRpcs, ProfilesRpcs, CVTemplatesRpcs, CVEditorRpcs, OnboardingRpcs, ApplicationsRpcs, CompaniesRpcs
- [x] Export merged Rpcs with all groups chained

---

### 0.11: Update Domain Exports

**File**: `packages/domain/src/index.ts`

NOTE: This has been changed so in schema we export from index there, in rpcs in index there and then we grab both in the root index.ts.

- [x] Export all from users domain
- [x] Export all from profiles domain
- [x] Export all from cv-templates domain
- [x] Export all from cv-editor domain
- [x] Export all from onboarding domain
- [x] Export all from applications domain
- [x] Export all from companies domain
- [x] Export all from rpcs

---

## Phase 1: Core User & Auth

**Goal**: Implement user authentication with Better Auth (email/password + OAuth)

### 1.1: Database Schema - Users

NOTE: Completed - User model exists with uuidv7 IDs, email/password auth configured.

**File**: `packages/db/src/prisma/models/user.prisma`

- [x] Add User model with id (uuidv7), email (unique), name, image
- [x] Add createdAt and updatedAt timestamps
- [x] Add index on email field (via @unique)
- [x] Add sessions, accounts relations (Better Auth)
- [x] Add cvs, chats relations
- [ ] Add profile relation (1:1 UserProfile) - will be added in Phase 2
- [ ] Add savedJobs relation (1:many SavedJob) - will be added in Phase 3
- [ ] Add applications relation (1:many Application) - will be added in Phase 5
- [ ] Add onboardingChats relation (1:1 OnboardingChat) - will be added in Phase 4

---

### 1.2: Better Auth Setup

**File**: `packages/auth/src/auth.ts`

For testing this we have to do some frontend work which is not noted down here below.

- [x] Install Better Auth: `bun add better-auth`
- [x] Install Prisma adapter: `bun add better-auth/adapters/prisma`
- [x] Create Auth service using Effect.Service pattern
- [x] Configure Prisma adapter with PrismaClient
- [x] Enable email/password authentication
- [x] Configure Google OAuth provider (clientId, clientSecret from env)
- [x] Configure LinkedIn OAuth provider (clientId, clientSecret from env)
- [x] Export auth instance from service
- [x] Implement getSession method (accepts Headers)
- [x] Implement requireAuth method (accepts Headers)

**Note**: Better Auth automatically creates API endpoints like `/api/auth/signin`, `/api/auth/signup`, `/api/auth/signout` that clients use directly.

**File**: `.env`

- [x] Add GOOGLE_CLIENT_ID
- [x] Add GOOGLE_CLIENT_SECRET
- [x] Add LINKEDIN_CLIENT_ID
- [x] Add LINKEDIN_CLIENT_SECRET

---

### 1.3: Implement UserService

**File**: `apps/server/src/services/user-repo.ts`

**Note**: No signup/signin/signout methods needed - Better Auth handles these via its own endpoints.

#### Service Setup

- [x] Create UserRepo class extending Effect.Service
- [x] Add Database dependency injection
- [x] Setup scoped Effect.gen function

#### getCurrentUser method

- [x] Get userId from Session context (Better Auth session) - currently using "temp-user-id" placeholder
- [x] Fetch user from database by userId
- [x] Transform to UserPublic schema
- [x] Use Effect.fn for spans

#### updateProfile method

- [ ] Get userId from Session context
- [ ] Update user name and/or avatarUrl in database
- [ ] Return updated UserPublic
- [ ] Add span and logging

---

### 1.4: Implement UsersRpcs Handler

**File**: `apps/server/src/handlers/users.ts`

- [x] Import UsersRpcs from @repo/domain
- [x] Import UserRepo
- [x] Create Users handler using UsersRpcs.toLayer
- [x] Wire up "users.getCurrentUser" endpoint to userRepo.getCurrentUser
- [x] Add DatabaseError to UserRpcError union in domain

---

### 1.5: Register Handler

**File**: `apps/server/src/handlers/index.ts`

- [x] Import Users handler
- [x] Merge Users into RpcHandlers with Layer.mergeAll

---

### 1.6: Session Context Middleware

**File**: `apps/server/src/services/session.ts`

- [x] Create Session service using Effect.Service
- [x] Extract session from request headers using Better Auth
- [x] Verify session with Better Auth
- [x] Return session data (userId, email) from fromHeaders method

**File**: `apps/server/src/handlers/users.ts`

- [x] Replace "temp-user-id" placeholder with Session.fromHeaders
- [x] Extract userId from session in handler

**File**: `apps/server/src/handlers/index.ts`

- [x] Provide Session.Default layer to RpcHandlers
- [x] Provide Auth.Live layer to RpcHandlers
- [x] Provide Database.Live layer to RpcHandlers
- [x] Provide UserRepo.Default layer to RpcHandlers

**Note**: Better Auth manages sessions automatically. Session service extracts userId from the session that Better Auth creates via request headers.

---

### 1.7: Testing

**File**: `apps/server/src/services/__tests__/user-service.test.ts`

- [x] Test getCurrentUser with valid session
- [x] Test getCurrentUser without session (should fail)

---

## Phase 2: Profile & CV Management

**Goal**: User profile management with CV upload/parsing and LinkedIn import

### 2.1: Database Schema - Profiles

**File**: `packages/db/prisma/schema.prisma`

- [x] Add UserProfile model (id, userId unique, fullName, email, phone, headline, summary, skills[], linkedinUrl, cvFileUrl, cvParsedText, createdAt, updatedAt)
- [x] Add **perfectJobDescription** field (text) - AI-generated description of user's ideal job
- [x] Add **perfectJobEmbedding** field (vector(1536)) - embedding for job matching
- [x] Add **activeTemplateId** field (string nullable) - current CV template ID
- [x] Add User relation to UserProfile
- [x] Add index on userId
- [x] Add Experience model (id, profileId, title, company, startDate, endDate, description, current)
- [x] Add UserProfile relation to Experience
- [x] Add index on profileId for Experience
- [x] Add Education model (id, profileId, institution, degree, field, startDate, endDate, current)
- [x] Add UserProfile relation to Education
- [x] Add index on profileId for Education
- [x] Enable pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- [x] Run migration: `bunx prisma migrate dev --name add_profiles`
- [x] Generate Prisma client

---

### 2.2: Implement ProfileService

**File**: `apps/server/src/services/profile-service.ts`

#### Service Setup

- [ ] Create ProfileService class extending Effect.Service
- [ ] Add Database dependency
- [ ] Add FileStorageService dependency
- [ ] Setup scoped Effect.gen

#### get method

- [ ] Fetch UserProfile by userId with experience and education relations
- [ ] If not found, create empty profile
- [ ] Decode to UserProfile schema
- [ ] Add span and logging

#### update method

- [ ] Fetch existing profile
- [ ] Update profile fields (fullName, email, phone, headline, summary, skills, linkedinUrl)
- [ ] Handle nested experience updates (upsert/delete)
- [ ] Handle nested education updates (upsert/delete)
- [ ] Return updated profile
- [ ] Add span and logging

#### uploadCV method

- [ ] Save file using FileStorageService
- [ ] OCR service using mistral (https://docs.mistral.ai/capabilities/document_ai/basic_ocr)
- [ ] Make a AI service using effect (check vendor for how to implement this) to extract structured data (name, skills[], experience[], education[])
- [ ] Return ParsedCVResult with text and extracted profile
- [ ] Add span and logging

#### generatePerfectJobDescription method

- [ ] Fetch complete profile with experience and education
- [ ] Call AI service to generate "perfect job description" (10 sentences describing ideal role based on user's skills, experience, preferences)
- [ ] Store description in profile.perfectJobDescription
- [ ] Call OpenAI embedding API (make a service) (text-embedding-3-small) on the perfect job description
- [ ] Store embedding in profile.perfectJobEmbedding vector
- [ ] Return success boolean
- [ ] Add span and logging

**Note**: This should be called automatically after profile creation (onboarding complete) and whenever profile is updated.

---

### 2.3: CV Parsing Library Setup

Check what mistral needs to install and an env variable for it has to be added.

---

### 2.4: Implement ProfilesRpcs Handler

**File**: `apps/server/src/rpcs/profiles.ts`

- [ ] Import ProfilesRpcs from @repo/domain
- [ ] Import ProfileService, FileStorageService
- [ ] Create ProfilesLiveHandler using ProfilesRpcs.toLayer
- [ ] Wire up "profiles.get" - get userId from Session context
- [ ] Wire up "profiles.update" - get userId from Session context
- [ ] Wire up "profiles.uploadCV" - get userId from Session context
- [ ] Wire up "profiles.parseLinkedIn" - get userId from Session context
- [ ] Wire up "profiles.generateEmbedding" - get userId from Session context (calls generatePerfectJobDescription internally)
- [ ] Provide ProfileService.Default, FileStorageService.Default, Database.Live layers

**Note**: Call generatePerfectJobDescription after onboarding.complete and after profiles.update

---

### 2.5: Register Handler

**File**: `apps/server/src/rpcs/index.ts`

- [ ] Import ProfilesLiveHandler
- [ ] Merge ProfilesLiveHandler into RpcHandlers

---

### 2.6: Testing

**File**: `apps/server/src/services/__tests__/profile-service.test.ts`

- [ ] Test get profile (creates if doesn't exist)
- [ ] Test update profile with basic fields
- [ ] Test update profile with nested experience/education
- [ ] Test uploadCV with PDF file
- [ ] Test uploadCV with DOCX file
- [ ] Test generateEmbedding

---

## Phase 3: Job Embeddings, CV Templates & Saved Jobs

**Goal**: Job AI summaries with embeddings, CV template system, and saved jobs tracking

### 3.1: Database Schema - Job Embeddings & Saved Jobs

**File**: `packages/db/prisma/schema.prisma`

- [ ] Update Job model: add **aiSummary** field (text) - AI-generated 10-sentence summary
- [ ] Update Job model: add **aiSummaryEmbedding** field (vector(1536)) - embedding of AI summary
- [ ] Add SavedJob model (id, userId, jobId, createdAt)
- [ ] Add User and Job relations to SavedJob
- [ ] Add unique constraint on (userId, jobId)
- [ ] Add indexes on userId and jobId for SavedJob
- [ ] Add InteractionAction enum (VIEW, SAVE, UNSAVE, APPLY, SKIP)
- [ ] Add UserJobInteraction model (id, userId, jobId, action, createdAt)
- [ ] Add Job relation to UserJobInteraction
- [ ] Add indexes on userId, jobId, and (userId, action) for UserJobInteraction
- [ ] Update Job model: add savedBy, interactions, applications relations
- [ ] Run migration: `bunx prisma migrate dev --name add_job_embeddings_saved_jobs`
- [ ] Generate Prisma client

---

### 3.2: Database Schema - CV Templates

**File**: `packages/db/prisma/schema.prisma`

**Note**: CV templates are SYSTEM templates created by Searcha, NOT user-created. Users select from available templates.

- [ ] Add CVTemplate model (id, name, description, typstCode text, createdAt, updatedAt)
- [ ] Add index on name
- [ ] Add CVEditorChat model (id, userId, typstCode text, createdAt, updatedAt)
- [ ] Add User relation to CVEditorChat
- [ ] Add index on userId
- [ ] Add CVChatMessage model (id, chatId, role enum, content text, createdAt)
- [ ] Add CVEditorChat relation to CVChatMessage
- [ ] Add index on chatId
- [ ] Run migration: `bunx prisma migrate dev --name add_cv_templates`
- [ ] Generate Prisma client

---

### 3.3: Extend JobService for Saved Jobs & Matching

**File**: `apps/server/src/services/job-service.ts`

**Note**: Match score calculation happens on-the-fly during job search, not as separate RPC.

#### Update search method

- [ ] Add support for minMatchScore and maxMatchScore filters in params
- [ ] Add support for sortByMatch parameter in params
- [ ] If user is authenticated: fetch user's perfectJobEmbedding from profile
- [ ] For each job: calculate matchScore using cosine similarity (job.aiSummaryEmbedding <=> user.perfectJobEmbedding)
- [ ] Convert cosine distance to percentage score (0-100)
- [ ] Generate matchReasons using quick AI call (compare job aiSummary with user perfectJobDescription)
- [ ] Filter jobs by match score range if minMatchScore or maxMatchScore provided
- [ ] Sort by match score if sortByMatch is true
- [ ] Return jobs with matchScore and matchReasons fields populated
- [ ] Add span and logging

#### getSaved method

- [ ] Query SavedJob where userId matches
- [ ] Include full Job relations (company, sources, requirements, contacts)
- [ ] Calculate matchScore for each job (same as search method)
- [ ] Decode to Job[]
- [ ] Add span and logging

#### save method

- [ ] Check if already saved
- [ ] Create SavedJob record
- [ ] Create UserJobInteraction with action SAVE
- [ ] Return true
- [ ] Add span and logging

#### unsave method

- [ ] Delete SavedJob record
- [ ] Create UserJobInteraction with action UNSAVE
- [ ] Return true
- [ ] Add span and logging

#### isSaved method

- [ ] Check if SavedJob exists for userId and jobId
- [ ] Return boolean
- [ ] Add span and logging

---

### 3.4: Update JobsRpcs Handler

**File**: `apps/server/src/rpcs/jobs.ts`

- [ ] Wire up "jobs.getSaved" - get userId from Session context
- [ ] Wire up "jobs.save" - get userId from Session context
- [ ] Wire up "jobs.unsave" - get userId from Session context
- [ ] Wire up "jobs.isSaved" - get userId from Session context

---

### 3.5: Update Platsbanken Sync - Add AI Summary Generation

**File**: `apps/server/src/services/platsbanken/platsbanken-sync.ts`

**Note**: This extends the existing hourly job sync to generate AI summaries and embeddings for ALL jobs.

- [ ] After fetching jobs from Platsbanken API, for each job:
- [ ] Check if company exists by organizationNumber
- [ ] If company is NEW: call CompanyEnrichmentService.enrichCompany() (see 3.6)
- [ ] Generate job AI summary (10 sentences) using Claude API
- [ ] Include company.aiDescription in context if available
- [ ] Call OpenAI embedding API (text-embedding-3-small) on the AI summary
- [ ] Store aiSummary and aiSummaryEmbedding in Job record
- [ ] Log summary generation progress and any errors
- [ ] Add span and logging

---

### 3.6: Implement CompanyEnrichmentService

**File**: `apps/server/src/services/company-enrichment-service.ts`

**Note**: This runs during job sync for NEW companies only (checked by organizationNumber).

#### Service Setup

- [ ] Create CompanyEnrichmentService class extending Effect.Service
- [ ] Add Database dependency
- [ ] Add Puppeteer/Playwright dependency for scraping
- [ ] Setup scoped Effect.gen

#### enrichCompany method

- [ ] Fetch company website from company record
- [ ] If no website: generate basic AI description from company name only
- [ ] If website exists: launch browser, navigate to homepage
- [ ] Scrape homepage and about page for text content
- [ ] Extract: description, mission statement, values, culture
- [ ] Find social media links in footer/header (LinkedIn, Facebook, Twitter)
- [ ] Call Claude API to generate company AI description (summary of what company does, their mission, culture)
- [ ] Store in company.aiDescription field
- [ ] Store raw scraped data in company.scrapedData (JSON)
- [ ] Set company.lastEnriched to now
- [ ] Close browser
- [ ] Handle errors gracefully (timeout, blocked, SSL errors)
- [ ] Return enriched company
- [ ] Add span and logging

---

### 3.7: Implement CVTemplateService

**File**: `apps/server/src/services/cv-template-service.ts`

**Note**: CV templates are system templates created by Searcha, not user-generated.

#### Service Setup

- [ ] Create CVTemplateService class extending Effect.Service
- [ ] Add Database dependency
- [ ] Setup scoped Effect.gen

#### list method

- [ ] Fetch all CVTemplate records from database
- [ ] Return CVTemplate[]
- [ ] Add span and logging

#### get method

- [ ] Fetch CVTemplate by id
- [ ] If not found, fail with TemplateNotFoundError
- [ ] Return template
- [ ] Add span and logging

#### setActive method

- [ ] Update user profile activeTemplateId
- [ ] Return success boolean
- [ ] Add span and logging

**Note**: No create/update/delete methods - templates are managed by Searcha admins via database seeds.

---

### 3.8: Implement CVEditorService

**File**: `apps/server/src/services/cv-editor-service.ts`

#### Service Setup

- [ ] Create CVEditorService class extending Effect.Service
- [ ] Add Database dependency
- [ ] Add Claude API dependency
- [ ] Add TypstService dependency
- [ ] Setup scoped Effect.gen

#### getOrCreateChat method

- [ ] Find or create CVEditorChat for user
- [ ] If new: initialize typstCode with user's active template (or default template)
- [ ] Fetch chat messages
- [ ] Return {chat, messages}
- [ ] Add span and logging

#### sendMessage method (streaming)

- [ ] Save user message to DB
- [ ] Fetch chat history and current typstCode
- [ ] Build Claude API request with system prompt (Swedish, edit Typst CV code based on user requests)
- [ ] Stream response from Claude API
- [ ] If Claude suggests Typst code changes: extract new code
- [ ] Save assistant response to DB
- [ ] Update chat.typstCode if code changed
- [ ] Yield CVChatStreamChunk with content and updatedTypstCode
- [ ] Handle errors gracefully
- [ ] Add span and logging

#### updateTypstCode method

- [ ] Update CVEditorChat.typstCode with manual user edits
- [ ] Return success boolean
- [ ] Add span and logging

#### compile method

- [ ] Call TypstService.compile with typstCode
- [ ] Return CompiledCVResult (PDF base64 or compilation errors)
- [ ] Add span and logging

---

### 3.9: Implement RPC Handlers

**File**: `apps/server/src/rpcs/cv-templates.ts`

- [ ] Import CVTemplatesRpcs from @repo/domain
- [ ] Import CVTemplateService
- [ ] Create CVTemplatesLiveHandler using CVTemplatesRpcs.toLayer
- [ ] Wire up "cvTemplates.list"
- [ ] Wire up "cvTemplates.get"
- [ ] Wire up "cvTemplates.setActive" - get userId from Session context
- [ ] Provide CVTemplateService.Default, Database.Live layers

**File**: `apps/server/src/rpcs/cv-editor.ts`

- [ ] Import CVEditorRpcs from @repo/domain
- [ ] Import CVEditorService, TypstService
- [ ] Create CVEditorLiveHandler using CVEditorRpcs.toLayer
- [ ] Wire up "cvEditor.getOrCreateChat" - get userId from Session context
- [ ] Wire up "cvEditor.sendMessage" (streaming) - get userId from Session context
- [ ] Wire up "cvEditor.updateTypstCode" - get userId from Session context
- [ ] Wire up "cvEditor.compile" - get userId from Session context
- [ ] Provide CVEditorService.Default, TypstService.Default, Database.Live layers

---

### 3.10: Register Handlers

**File**: `apps/server/src/rpcs/index.ts`

- [ ] Import CVTemplatesLiveHandler, CVEditorLiveHandler
- [ ] Merge into RpcHandlers with Layer.mergeAll

---

### 3.11: Seed Database with System CV Templates

**File**: `apps/server/src/scripts/seed-cv-templates.ts`

- [ ] Create 3-5 professional CV templates in Typst format
- [ ] Each template should have: name, description, complete typstCode
- [ ] Templates should be designed by Searcha (professional, Swedish-appropriate)
- [ ] Insert as CVTemplate records in database
- [ ] Run script: `bun run apps/server/src/scripts/seed-cv-templates.ts`

---

### 3.12: Testing

**File**: `apps/server/src/services/__tests__/job-service.test.ts`

- [ ] Test search with minMatchScore filter
- [ ] Test search with maxMatchScore filter
- [ ] Test search with sortByMatch
- [ ] Test getSaved with match scores calculated
- [ ] Test save (creates SavedJob and interaction)
- [ ] Test unsave (deletes SavedJob and creates interaction)
- [ ] Test isSaved

**File**: `apps/server/src/services/__tests__/cv-template-service.test.ts`

- [ ] Test list templates
- [ ] Test get template by id
- [ ] Test setActive template

**File**: `apps/server/src/services/__tests__/cv-editor-service.test.ts`

- [ ] Test getOrCreateChat (creates with default template)
- [ ] Test sendMessage (mocked Claude API, streaming)
- [ ] Test updateTypstCode (manual edits)
- [ ] Test compile (mocked Typst compilation)

---

## Phase 4: Onboarding Chat

**Goal**: AI chat-based onboarding that helps users build their profile

### 4.1: Database Schema - Onboarding

**File**: `packages/db/prisma/schema.prisma`

- [ ] Add OnboardingStatus enum (ACTIVE, COMPLETED, ABANDONED)
- [ ] Add MessageRole enum (USER, ASSISTANT)
- [ ] Add OnboardingChat model (id, userId, status, createdAt, completedAt)
- [ ] Add User relation to OnboardingChat
- [ ] Add index on userId and status
- [ ] Add ChatMessage model (id, chatId, role, content text, createdAt)
- [ ] Add OnboardingChat relation to ChatMessage
- [ ] Add index on chatId
- [ ] Update User model: add onboardingChats relation
- [ ] Run migration: `bunx prisma migrate dev --name add_onboarding`
- [ ] Generate Prisma client

---

### 4.2: Implement OnboardingService

**File**: `apps/server/src/services/onboarding-service.ts`

#### Service Setup

- [ ] Create OnboardingService class extending Effect.Service
- [ ] Add Database dependency
- [ ] Add ProfileService dependency
- [ ] Add Claude API client dependency
- [ ] Setup scoped Effect.gen

#### start method

- [ ] Create OnboardingChat with status ACTIVE
- [ ] Create initial assistant message: greeting in Swedish, ask for CV upload or manual entry
- [ ] Save chat and message to DB
- [ ] Return OnboardingChat
- [ ] Add span and logging

#### sendMessage method (streaming)

- [ ] Verify chat exists and is ACTIVE
- [ ] Save user message to DB
- [ ] Fetch all chat messages for context
- [ ] Build Claude API request with system prompt (Swedish, professional, collect profile info)
- [ ] Define function tools: updateProfile, requestMissingInfo, suggestCompletion
- [ ] Stream response from Claude API
- [ ] For each chunk: yield ChatStreamChunk
- [ ] Save complete assistant response to DB
- [ ] If function calls: execute and continue conversation
- [ ] Handle errors gracefully
- [ ] Add span and logging

#### uploadCV method

- [ ] Verify chat exists
- [ ] Call ProfileService.uploadCV with file data
- [ ] Auto-apply extracted profile data using ProfileService.update
- [ ] Create assistant message confirming CV upload and extracted info
- [ ] Return success message
- [ ] Add span and logging

#### complete method

- [ ] Verify chat exists and is ACTIVE
- [ ] Fetch user profile
- [ ] Verify minimum profile completeness (name, headline, skills)
- [ ] Mark chat status as COMPLETED, set completedAt
- [ ] Call ProfileService.generateEmbedding
- [ ] Return final UserProfile
- [ ] Add span and logging

#### getChat method

- [ ] Fetch OnboardingChat by chatId and userId
- [ ] If not found, fail with OnboardingChatNotFoundError
- [ ] Fetch all ChatMessage records for chat
- [ ] Return chat and messages
- [ ] Add span and logging

---

### 4.3: Claude API Chat Integration

- [ ] Create system prompt for onboarding (Swedish, friendly, collect: name, skills, experience, education)
- [ ] Define function schemas for tool use
- [ ] Implement streaming response handling
- [ ] Handle function call execution within conversation

---

### 4.4: Implement OnboardingRpcs Handler

**File**: `apps/server/src/rpcs/onboarding.ts`

- [ ] Import OnboardingRpcs from @repo/domain
- [ ] Import OnboardingService, ProfileService
- [ ] Create OnboardingLiveHandler using OnboardingRpcs.toLayer
- [ ] Wire up "onboarding.start" - get userId from Session context
- [ ] Wire up "onboarding.sendMessage" (streaming) - get userId from Session context
- [ ] Wire up "onboarding.uploadCV" - get userId from Session context
- [ ] Wire up "onboarding.complete" - get userId from Session context
- [ ] Wire up "onboarding.getChat" - get userId from Session context
- [ ] Provide OnboardingService.Default, ProfileService.Default, Database.Live layers

---

### 4.5: Register Handler

**File**: `apps/server/src/rpcs/index.ts`

- [ ] Import OnboardingLiveHandler
- [ ] Merge OnboardingLiveHandler into RpcHandlers

---

### 4.6: Testing

**File**: `apps/server/src/services/__tests__/onboarding-service.test.ts`

- [ ] Test start (creates chat with greeting)
- [ ] Test sendMessage (mocked Claude API)
- [ ] Test uploadCV (integrates with ProfileService)
- [ ] Test complete (marks completed, generates embedding)
- [ ] Test getChat

---

## Phase 5: Application Generation

**Goal**: AI agent that generates tailored CVs and cover letters using Typst

### 5.1: Database Schema - Applications

**File**: `packages/db/prisma/schema.prisma`

- [ ] Add ApplicationStatus enum (DRAFT, APPLIED, ARCHIVED)
- [ ] Add Application model (id, userId, jobId, generatedCvText, generatedLetterText, companyResearchNotes text, status, createdAt, appliedAt)
- [ ] Add User and Job relations to Application
- [ ] Add indexes on userId, jobId, status
- [ ] Update User model: add applications relation
- [ ] Update Job model: add applications relation
- [ ] Run migration: `bunx prisma migrate dev --name add_applications`
- [ ] Generate Prisma client

---

### 5.2: Create Typst Templates

**File**: `apps/server/src/templates/cv.typ`

- [ ] Design professional Swedish CV template in Typst
- [ ] Add sections: personal info, headline, summary, experience, education, skills
- [ ] Use clean, modern formatting
- [ ] Add template variables for dynamic content
- [ ] Test rendering with sample data

**File**: `apps/server/src/templates/letter.typ`

- [ ] Design professional Swedish cover letter template in Typst
- [ ] Add sections: greeting, introduction, body, closing
- [ ] Use formal Swedish language style
- [ ] Add template variables for dynamic content
- [ ] Test rendering with sample data

---

### 5.3: Implement ApplicationService

**File**: `apps/server/src/services/application-service.ts`

#### Service Setup

- [ ] Create ApplicationService class extending Effect.Service
- [ ] Add Database dependency
- [ ] Add ProfileService dependency
- [ ] Add JobService dependency
- [ ] Add CompanyService dependency
- [ ] Add Claude API dependency
- [ ] Add TypstService dependency
- [ ] Setup scoped Effect.gen

#### generate method (streaming)

- [ ] **Stage: researching_company (10%)** - Fetch job with company, scrape company website if available, extract mission/values/culture, yield progress
- [ ] **Stage: analyzing_job (30%)** - Extract requirements from job description, identify key skills/experience needed, yield progress
- [ ] **Stage: generating_cv (60%)** - Fetch user profile, call Claude to generate tailored CV text (emphasize relevant experience, reorder by relevance, match keywords), yield progress
- [ ] **Stage: generating_letter (80%)** - Call Claude to generate personalized letter (reference company research, explain fit, Swedish tone), yield progress
- [ ] **Stage: finalizing (95%)** - Save Application to DB with status DRAFT, store research notes, yield progress
- [ ] **Stage: complete (100%)** - Return applicationId, mark done, yield final progress
- [ ] Add comprehensive error handling
- [ ] Add span and logging

#### get method

- [ ] Fetch Application by applicationId and userId
- [ ] Include Job relation
- [ ] If not found, fail with ApplicationNotFoundError
- [ ] Return Application
- [ ] Add span and logging

#### list method

- [ ] Fetch all Applications for userId
- [ ] Include Job relations
- [ ] Order by createdAt DESC
- [ ] Return Application[]
- [ ] Add span and logging

#### regenerate method (streaming)

- [ ] Similar to generate but use feedback to improve
- [ ] Include user feedback in Claude prompts
- [ ] Update existing Application record
- [ ] Stream progress same as generate
- [ ] Add span and logging

#### download method

- [ ] Fetch Application
- [ ] Parse generatedCvText and generatedLetterText
- [ ] If format is PDF: render using Typst templates, convert to base64
- [ ] If format is DOCX: use docx library to generate, convert to base64
- [ ] Return DownloadApplicationResult
- [ ] Add span and logging

#### markApplied method

- [ ] Fetch Application
- [ ] Update status to APPLIED
- [ ] Set appliedAt to now
- [ ] Create UserJobInteraction with action APPLY
- [ ] Return updated Application
- [ ] Add span and logging

---

### 5.4: Claude API Prompts for Generation

**File**: `apps/server/src/prompts/cv-generation.ts`

- [ ] Create system prompt for CV generation (Swedish, professional, tailor to job)
- [ ] Create user prompt template with placeholders for profile, job, company research
- [ ] Export prompt builder function

**File**: `apps/server/src/prompts/letter-generation.ts`

- [ ] Create system prompt for letter generation (Swedish, formal, personalized)
- [ ] Create user prompt template with placeholders
- [ ] Export prompt builder function

---

### 5.5: Typst Integration

**File**: `apps/server/src/services/typst.ts`

- [ ] Extend existing TypstService for CV rendering
- [ ] Add renderCV method (takes CV data, returns PDF buffer)
- [ ] Add renderLetter method (takes letter data, returns PDF buffer)
- [ ] Handle Typst compilation errors

---

### 5.6: DOCX Generation

- [ ] Install docx library: `bun add docx`
- [ ] Create DOCX template builders for CV and letter
- [ ] Implement conversion to base64

---

### 5.7: Implement ApplicationsRpcs Handler

**File**: `apps/server/src/rpcs/applications.ts`

- [ ] Import ApplicationsRpcs from @repo/domain
- [ ] Import ApplicationService, ProfileService, JobService, CompanyService
- [ ] Create ApplicationsLiveHandler using ApplicationsRpcs.toLayer
- [ ] Wire up "applications.generate" (streaming) - get userId from Session context
- [ ] Wire up "applications.get" - get userId from Session context
- [ ] Wire up "applications.list" - get userId from Session context
- [ ] Wire up "applications.regenerate" (streaming) - get userId from Session context
- [ ] Wire up "applications.download" - get userId from Session context
- [ ] Wire up "applications.markApplied" - get userId from Session context
- [ ] Provide all required service layers

---

### 5.8: Register Handler

**File**: `apps/server/src/rpcs/index.ts`

- [ ] Import ApplicationsLiveHandler
- [ ] Merge ApplicationsLiveHandler into RpcHandlers

---

### 5.9: Testing

**File**: `apps/server/src/services/__tests__/application-service.test.ts`

- [ ] Test generate (mocked Claude API and streaming)
- [ ] Test get application
- [ ] Test list applications
- [ ] Test download as PDF
- [ ] Test download as DOCX
- [ ] Test markApplied

---

## Phase 6: Company Pages & SEO

**Goal**: Company profiles with SEO-optimized pages (enrichment happens automatically during job sync in Phase 3.6)

### 6.1: Extend Company Schema

**File**: `packages/db/prisma/schema.prisma`

**Note**: Company enrichment (aiDescription, scraping) was already added in Phase 3.6. Just need slug for SEO URLs.

- [ ] Update Company model: add slug field (unique)
- [ ] Add index on slug
- [ ] Add index on industry (if not exists)
- [ ] Add index on name (if not exists)
- [ ] Run migration: `bunx prisma migrate dev --name add_company_slug`
- [ ] Generate Prisma client

---

### 6.2: Generate Slugs for Existing Companies

**File**: `apps/server/src/scripts/generate-company-slugs.ts`

- [ ] Fetch all companies without slug
- [ ] For each company: slugify name (lowercase, replace spaces with hyphens, remove special chars)
- [ ] Check uniqueness, append number if needed
- [ ] Update company with slug
- [ ] Run script: `bun run apps/server/src/scripts/generate-company-slugs.ts`

---

### 6.3: Implement CompanyService

**File**: `apps/server/src/services/company-service.ts`

**Note**: No scraping methods here - that's handled by CompanyEnrichmentService in Phase 3.6.

#### Service Setup

- [ ] Create CompanyService class extending Effect.Service
- [ ] Add Database dependency
- [ ] Setup scoped Effect.gen

#### search method

- [ ] Build where clause from CompanySearchParams
- [ ] Query companies with filters (name contains, industry, size range)
- [ ] Count total matching companies
- [ ] Fetch paginated results with jobCount aggregate
- [ ] Return CompanySearchResult
- [ ] Add span and logging

#### getById method

- [ ] Fetch Company by id
- [ ] If not found, fail with CompanyNotFoundError
- [ ] Aggregate job count
- [ ] Return CompanyDetailed
- [ ] Add span and logging

#### getJobs method

- [ ] Fetch Company by companyId
- [ ] Fetch paginated jobs for company
- [ ] Count total jobs
- [ ] Return CompanyJobsResult
- [ ] Add span and logging

---

### 6.4: Implement CompaniesRpcs Handler

**File**: `apps/server/src/rpcs/companies.ts`

- [ ] Import CompaniesRpcs from @repo/domain
- [ ] Import CompanyService
- [ ] Create CompaniesLiveHandler using CompaniesRpcs.toLayer
- [ ] Wire up "companies.search"
- [ ] Wire up "companies.getById"
- [ ] Wire up "companies.getJobs"
- [ ] Provide CompanyService.Default, Database.Live layers

---

### 6.5: Register Handler

**File**: `apps/server/src/rpcs/index.ts`

- [ ] Import CompaniesLiveHandler
- [ ] Merge CompaniesLiveHandler into RpcHandlers

---

### 6.6: SEO Pages for Companies

**File**: `apps/web/app/routes/foretag.$slug.tsx`

- [ ] Create Tanstack Router route for /foretag/:slug
- [ ] Fetch company by slug using RPC client (SSR)
- [ ] Fetch first page of company jobs
- [ ] Generate meta tags (title with company name, description using aiDescription, og:image)
- [ ] Add structured data (Organization schema with JSON-LD)
- [ ] Render company info: logo, name, aiDescription, industry, size, website link
- [ ] Display social media links from scrapedData
- [ ] List jobs with pagination
- [ ] Link to individual job pages (/jobb/:jobSlug)
- [ ] Use Swedish language throughout
- [ ] Add breadcrumbs for SEO

---

### 6.7: Sitemap Generation

**File**: `apps/web/app/routes/sitemap.xml.tsx`

- [ ] Create route for /sitemap.xml
- [ ] Fetch all companies with slugs
- [ ] Fetch all jobs with slugs
- [ ] Generate XML sitemap including:
  - Static pages (/, /om-oss, /kontakt)
  - Job pages (/jobb/:slug)
  - Company pages (/foretag/:slug)
- [ ] Set proper lastmod dates
- [ ] Return XML response with correct headers

---

### 6.8: Testing

**File**: `apps/server/src/services/__tests__/company-service.test.ts`

- [ ] Test search companies
- [ ] Test getById
- [ ] Test getJobs

---

## Phase 7: Frontend Implementation

**Goal**: Build user interfaces for both public site (web) and authenticated app (dashboard)

### 7.1: Setup RPC Client in Frontend

**File**: `apps/web/app/lib/rpc-client.ts`

- [ ] Import Rpcs from @repo/domain
- [ ] Create RPC HTTP client pointing to server (http://localhost:9090)
- [ ] Configure with proper serialization
- [ ] Export client instance

**File**: `apps/dashboard/src/lib/rpc-client.ts`

- [ ] Same as above for dashboard app
- [ ] Include session/auth token in requests

---

### 7.2: Public Web App (apps/web) - Job Listings

**File**: `apps/web/app/routes/index.tsx`

- [ ] Create homepage with hero section (Swedish)
- [ ] Add job search form (query, location, filters)
- [ ] Call jobs.search RPC with form params
- [ ] Display job results in cards (title, company, location, salary, publishedAt)
- [ ] Add pagination
- [ ] Link to individual job pages

**File**: `apps/web/app/routes/jobb.$slug.tsx`

- [ ] Fetch job by slug (SSR)
- [ ] Generate meta tags for SEO
- [ ] Add structured data (JobPosting schema)
- [ ] Display full job details (description, requirements, application info)
- [ ] Show company info with link to company page
- [ ] Add "Apply" button (redirects to dashboard if not logged in)

---

### 7.3: Public Web App - Company Pages

Already covered in 6.8, but add:

- [ ] Style company page with Tailwind CSS
- [ ] Add responsive design
- [ ] Include company logo and branding
- [ ] Show job listings with filters

---

### 7.4: Dashboard App (apps/dashboard) - Authentication

**File**: `apps/dashboard/src/lib/auth-client.ts`

- [ ] Install Better Auth client: `bun add better-auth/client`
- [ ] Create Better Auth client instance
- [ ] Configure to point to server auth endpoints
- [ ] Export auth client

**File**: `apps/dashboard/src/routes/auth/signup.tsx`

- [ ] Create signup form (email, password, name)
- [ ] Call Better Auth client `authClient.signUp()` (NOT RPC)
- [ ] Handle errors (email exists, weak password)
- [ ] Redirect to onboarding on success

**File**: `apps/dashboard/src/routes/auth/signin.tsx`

- [ ] Create signin form (email, password)
- [ ] Call Better Auth client `authClient.signIn()` (NOT RPC)
- [ ] Handle errors (invalid credentials)
- [ ] Redirect to dashboard on success

**File**: `apps/dashboard/src/routes/auth/oauth.tsx`

- [ ] Add Google OAuth button using Better Auth client
- [ ] Add LinkedIn OAuth button using Better Auth client
- [ ] Better Auth handles OAuth flow automatically
- [ ] Redirect to onboarding for new users, dashboard for existing

**Note**: All authentication (signup/signin/signout/OAuth) uses Better Auth client directly, NOT RPCs. Better Auth manages sessions via cookies.

---

### 7.5: Dashboard App - Onboarding Chat

**File**: `apps/dashboard/src/routes/onboarding.tsx`

- [ ] Create chat interface with message list
- [ ] Call onboarding.start on mount
- [ ] Display assistant greeting
- [ ] Add message input with send button
- [ ] Call onboarding.sendMessage (streaming) on submit
- [ ] Display streaming responses in real-time
- [ ] Add CV upload button that calls onboarding.uploadCV
- [ ] Show extracted profile data for confirmation
- [ ] Add "Complete Onboarding" button that calls onboarding.complete
- [ ] Redirect to dashboard on completion

**UI Components**

- [ ] ChatMessage component (user vs assistant styling)
- [ ] ChatInput component
- [ ] CVUploadButton component
- [ ] LoadingIndicator for streaming

---

### 7.6: Dashboard App - Profile Management

**File**: `apps/dashboard/src/routes/profile.tsx`

- [ ] Fetch profile using profiles.get
- [ ] Display profile form with sections: personal info, headline, summary, skills
- [ ] Add experience list with add/edit/delete
- [ ] Add education list with add/edit/delete
- [ ] Call profiles.update on save
- [ ] Add "Upload New CV" button calling profiles.uploadCV
- [ ] Show parsed CV data for review before applying
- [ ] Add link to CV Editor page (/cv-editor)

**UI Components**

- [ ] ProfileForm component
- [ ] ExperienceList component
- [ ] EducationList component
- [ ] SkillsInput component (tags)

---

### 7.7: Dashboard App - CV Editor (Three-Panel Interface)

**File**: `apps/dashboard/src/routes/cv-editor.tsx`

**Layout**: Three-panel horizontal layout (chat | PDF preview | Typst code editor)

#### Left Panel: Chat with AI

- [ ] Call cvEditor.getOrCreateChat on mount
- [ ] Display chat messages (user vs assistant styling)
- [ ] Add message input with send button
- [ ] Call cvEditor.sendMessage (streaming) on submit
- [ ] Display streaming responses in real-time
- [ ] When AI updates Typst code: auto-trigger compile (debounced, 500ms delay)

#### Middle Panel: PDF Preview

- [ ] Show compiled PDF in iframe or PDF viewer component
- [ ] Auto-refresh when new compilation completes
- [ ] Show "Compiling..." loader during compilation
- [ ] Display compilation errors if any

#### Right Panel: Typst Code Editor

- [ ] Use Monaco Editor or CodeMirror for Typst syntax
- [ ] Load current typstCode from chat
- [ ] Enable manual editing
- [ ] On manual edit: call cvEditor.updateTypstCode (debounced, 1s delay)
- [ ] Add manual "Compile" button for user-triggered compilation
- [ ] Highlight Typst syntax

#### Template Management

- [ ] Add template selector dropdown at top
- [ ] Call cvTemplates.list to fetch available system templates
- [ ] User can switch templates from dropdown
- [ ] Call cvTemplates.setActive when template changed
- [ ] Load new template typstCode into editor on template change

**UI Components**

- [ ] CVChatPanel component
- [ ] CVPDFPreview component
- [ ] CVTypstEditor component (Monaco/CodeMirror wrapper)
- [ ] TemplateSelector component

---

### 7.8: Dashboard App - Job Search & Matching

**File**: `apps/dashboard/src/routes/jobs/search.tsx`

**Note**: Match score is just another job field, not a separate feature.

- [ ] Add search form (query, location, filters)
- [ ] Add match score filter inputs (minMatchScore, maxMatchScore sliders 0-100)
- [ ] Add "Sort by Match" toggle checkbox
- [ ] Call jobs.search RPC with minMatchScore, maxMatchScore, sortByMatch params
- [ ] Display results with matchScore badges (if user authenticated and matchScore available)
- [ ] Show matchReasons in expandable section for each job
- [ ] Add "Save Job" button calling jobs.save
- [ ] Add tab/filter to show saved jobs only (call jobs.getSaved)
- [ ] Implement pagination

**File**: `apps/dashboard/src/routes/jobs/$jobId.tsx`

- [ ] Fetch job using jobs.getById (includes matchScore if user authenticated)
- [ ] Check if saved using jobs.isSaved
- [ ] Display matchScore prominently with badge/indicator
- [ ] Show matchReasons in expandable section
- [ ] Add save/unsave toggle button
- [ ] Add "Generate Application" button (navigate to /applications/generate/:jobId)

---

### 7.9: Dashboard App - Application Generation

**File**: `apps/dashboard/src/routes/applications/generate/$jobId.tsx`

- [ ] Fetch job details
- [ ] Call applications.generate (streaming)
- [ ] Display progress bar with stages and percentages
- [ ] Show stage-specific messages (researching, analyzing, generating)
- [ ] On completion: redirect to application detail page

**File**: `apps/dashboard/src/routes/applications/$applicationId.tsx`

- [ ] Fetch application using applications.get
- [ ] Display generated CV text (formatted)
- [ ] Display generated letter text (formatted)
- [ ] Show company research notes
- [ ] Add "Download PDF" button calling applications.download (format: pdf)
- [ ] Add "Download DOCX" button calling applications.download (format: docx)
- [ ] Add "Regenerate with Feedback" form calling applications.regenerate
- [ ] Add "Mark as Applied" button calling applications.markApplied

**File**: `apps/dashboard/src/routes/applications/index.tsx`

- [ ] Fetch applications using applications.list
- [ ] Display list grouped by status (draft, applied, archived)
- [ ] Show job title, company, creation date for each
- [ ] Link to detail page

---

### 7.10: Dashboard App - Saved Jobs

**File**: `apps/dashboard/src/routes/jobs/saved.tsx`

- [ ] Call jobs.getSaved
- [ ] Display saved jobs list
- [ ] Show match scores
- [ ] Add unsave button
- [ ] Add "Generate Application" button for each job

---

### 7.11: Shared UI Components (packages/ui)

- [ ] Button component (primary, secondary, ghost variants)
- [ ] Input component (text, email, password, textarea)
- [ ] Card component
- [ ] Badge component (for tags, status)
- [ ] Dialog/Modal component
- [ ] Progress bar component
- [ ] Tabs component
- [ ] Form components (Label, FormField, FormError)
- [ ] Loading spinner
- [ ] Avatar component
- [ ] Dropdown menu component
- [ ] Pagination component
- [ ] CodeEditor component (Monaco/CodeMirror wrapper)
- [ ] Slider component (for match score filters)
- [ ] ExpandableSection component (for match reasons)

---

### 7.12: Styling & Design System

- [ ] Setup Tailwind CSS with shared config
- [ ] Define color palette (Swedish-inspired, professional)
- [ ] Define typography scale
- [ ] Create spacing and sizing utilities
- [ ] Add dark mode support (optional)
- [ ] Ensure responsive design for all pages

---

### 7.13: Testing Frontend

**File**: `apps/dashboard/src/__tests__/onboarding.test.tsx`

- [ ] Test onboarding chat flow
- [ ] Test CV upload
- [ ] Test profile completion

**File**: `apps/dashboard/src/__tests__/application-generation.test.tsx`

- [ ] Test application generation flow
- [ ] Test streaming progress display
- [ ] Test download buttons

---

## Database Schema Reference

Complete schema for reference:

```prisma
model User {
  id              String           @id @default(cuid())
  email           String           @unique
  name            String?
  avatarUrl       String?
  profile         UserProfile?
  savedJobs       SavedJob[]
  applications    Application[]
  onboardingChats OnboardingChat[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  @@index([email])
}

model UserProfile {
  id                     String       @id @default(cuid())
  userId                 String       @unique
  user                   User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName               String?
  email                  String?
  phone                  String?
  headline               String?
  summary                String?
  skills                 String[]
  linkedinUrl            String?
  cvFileUrl              String?
  cvParsedText           String?      @db.Text
  perfectJobDescription  String?      @db.Text
  perfectJobEmbedding    Unsupported("vector(1536)")?
  activeTemplateId       String?
  experience             Experience[]
  education              Education[]
  createdAt              DateTime     @default(now())
  updatedAt              DateTime     @updatedAt
  @@index([userId])
}

model Experience {
  id          String      @id @default(cuid())
  profileId   String
  profile     UserProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  title       String
  company     String
  startDate   DateTime
  endDate     DateTime?
  description String?     @db.Text
  current     Boolean     @default(false)
  @@index([profileId])
}

model Education {
  id          String      @id @default(cuid())
  profileId   String
  profile     UserProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  institution String
  degree      String
  field       String
  startDate   DateTime
  endDate     DateTime?
  current     Boolean     @default(false)
  @@index([profileId])
}

model OnboardingChat {
  id          String           @id @default(cuid())
  userId      String
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  status      OnboardingStatus @default(ACTIVE)
  messages    ChatMessage[]
  createdAt   DateTime         @default(now())
  completedAt DateTime?
  @@index([userId])
  @@index([status])
}

model ChatMessage {
  id        String         @id @default(cuid())
  chatId    String
  chat      OnboardingChat @relation(fields: [chatId], references: [id], onDelete: Cascade)
  role      MessageRole
  content   String         @db.Text
  createdAt DateTime       @default(now())
  @@index([chatId])
}

enum OnboardingStatus {
  ACTIVE
  COMPLETED
  ABANDONED
}

enum MessageRole {
  USER
  ASSISTANT
}

model Company {
  id                 String   @id @default(cuid())
  name               String
  slug               String   @unique
  organizationNumber String?
  website            String?
  logo               String?
  description        String?  @db.Text
  aiDescription      String?  @db.Text
  industry           String?
  size               String?
  socialMedia        Json?
  scrapedData        Json?
  lastEnriched       DateTime?
  jobs               Job[]
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  @@index([slug])
  @@index([industry])
  @@index([name])
}

model Job {
  id                 String              @id @default(cuid())
  // ... existing fields ...
  companyId          String?
  company            Company?            @relation(fields: [companyId], references: [id])
  aiSummary          String?             @db.Text
  aiSummaryEmbedding Unsupported("vector(1536)")?
  savedBy            SavedJob[]
  interactions       UserJobInteraction[]
  applications       Application[]
}

model SavedJob {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobId     String
  job       Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([userId, jobId])
  @@index([userId])
  @@index([jobId])
}

model UserJobInteraction {
  id        String            @id @default(cuid())
  userId    String
  jobId     String
  job       Job               @relation(fields: [jobId], references: [id], onDelete: Cascade)
  action    InteractionAction
  createdAt DateTime          @default(now())
  @@index([userId])
  @@index([jobId])
  @@index([userId, action])
}

enum InteractionAction {
  VIEW
  SAVE
  UNSAVE
  APPLY
  SKIP
}

model Application {
  id                   String            @id @default(cuid())
  userId               String
  user                 User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobId                String
  job                  Job               @relation(fields: [jobId], references: [id], onDelete: Cascade)
  generatedCvText      String            @db.Text
  generatedLetterText  String            @db.Text
  companyResearchNotes String?           @db.Text
  status               ApplicationStatus @default(DRAFT)
  createdAt            DateTime          @default(now())
  appliedAt            DateTime?
  @@index([userId])
  @@index([jobId])
  @@index([status])
}

enum ApplicationStatus {
  DRAFT
  APPLIED
  ARCHIVED
}

// CV Templates (system-created by Searcha)
model CVTemplate {
  id          String   @id @default(cuid())
  name        String
  description String?
  typstCode   String   @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([name])
}

model CVEditorChat {
  id        String          @id @default(cuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  typstCode String          @db.Text
  messages  CVChatMessage[]
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  @@index([userId])
}

model CVChatMessage {
  id        String        @id @default(cuid())
  chatId    String
  chat      CVEditorChat  @relation(fields: [chatId], references: [id], onDelete: Cascade)
  role      MessageRole
  content   String        @db.Text
  createdAt DateTime      @default(now())
  @@index([chatId])
}

// Update User model to include CV relations
model User {
  // ... existing fields ...
  cvEditorChats CVEditorChat[]
}
```
