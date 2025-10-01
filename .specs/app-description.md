# AI Job Platform - Complete App Definition

## Core User Flows

### 1. Onboarding Flow
**Goal:** Get enough user data to enable job matching and CV generation
- Start with optional paths: LinkedIn import, CV upload, or chat
- Progressive profiling through conversational UI
- Real-time profile completion tracker
- Immediate value delivery (show matching jobs even at 30% completion)

### 2. Job Discovery Flow  
**Goal:** Surface relevant jobs with clear match percentages
- Semantic search with filters
- Match score explanation
- Save/hide/apply actions
- Background job monitoring for new matches

### 3. Application Flow
**Goal:** One-click apply with personalized materials
- Generate cover letter with company research
- CV optimization for specific job
- Application tracking
- Follow-up reminders

---

## Route Structure

```
/                           # Landing page
/auth
  /login                   # Email/password + social login
  /register                # Sign up with email verification
  /forgot-password         
  /verify-email           

/onboarding
  /welcome                 # Choose onboarding method
  /import                  # LinkedIn/CV import
  /chat                    # AI chat profiling
  /preview                 # Review extracted/generated profile

/dashboard                 # Main user dashboard
  /applications           # Application tracker
  /saved-jobs             # Bookmarked jobs
  /profile                # Edit profile/preferences
  /settings               # Account settings

/jobs
  /                       # Job search/browse
  /[id]                   # Single job view
  /[id]/apply            # Application process

/cv
  /                       # CV templates gallery
  /builder                # Interactive CV builder
  /preview                # PDF preview
  /versions               # Version history

/cover-letter
  /generate               # AI generation interface
  /templates              # Saved templates
  /history                # Previous letters

/subscription
  /plans                  # Pricing tiers
  /checkout               # Payment flow
  /manage                 # Manage subscription

/admin (B2B future)
  /company-profile        
  /job-posts             
  /candidates            
  /analytics             
```

---

## Page Components Breakdown

### Landing Page (`/`)
```
<Hero>
  - ValueProposition ("Hitta ditt drömjobb med AI")
  - CTAButtons (Try Free, See Demo)
  - TrustIndicators (user count, success stories)

<PainPointsSection>
  - ComparisonTable (vs Arbetsförmedlingen, LinkedIn)
  - FeatureCards (AI Matching, Swedish CVs, Auto-Apply)

<LiveDemo>
  - SampleJobMatcher
  - CVBeforeAfter
  - CoverLetterPreview

<PricingPreview>
  - FreeTier
  - PremiumFeatures
  - EnterpriseTeaser

<SocialProof>
  - UserTestimonials
  - SuccessMetrics
  - MediaMentions
```

### Dashboard (`/dashboard`)
```
<DashboardLayout>
  <Sidebar>
    - NavigationMenu
    - ProfileCompleteness
    - QuickActions
    - UpgradePrompt

  <MainContent>
    <StatsOverview>
      - ApplicationsThisWeek
      - ProfileViews
      - MatchScore
      - ResponseRate

    <JobRecommendations>
      - TopMatches (3-5 jobs)
      - NewJobsAlert
      - ExpiringJobs

    <ApplicationStatus>
      - ActiveApplications
      - PendingActions
      - InterviewScheduled

    <WeeklyGoals>
      - ApplicationTarget
      - ProfileUpdates
      - NetworkingTasks
```

### Job Search (`/jobs`)
```
<JobSearchLayout>
  <FilterSidebar>
    - LocationFilter
    - SalaryRange
    - JobType (remote/hybrid/onsite)
    - ExperienceLevel
    - Industry
    - Company Size
    - Posted Date
    - LanguageRequirements

  <SearchHeader>
    - SemanticSearchBar
    - SortOptions (relevance/date/salary)
    - ViewToggle (list/grid)
    - SaveSearchButton

  <JobList>
    <JobCard>
      - CompanyLogo
      - JobTitle
      - MatchPercentage
      - KeyRequirements
      - SalaryRange
      - QuickApplyButton
      - SaveButton
      - HideButton

  <LoadMorePagination>
```

### Single Job View (`/jobs/[id]`)
```
<JobDetailLayout>
  <JobHeader>
    - CompanyInfo
    - JobTitle
    - PostedDate
    - ApplicationDeadline

  <MatchAnalysis>
    - OverallMatchScore
    - SkillsBreakdown
    - ExperienceMatch
    - MissingRequirements
    - ImprovementSuggestions

  <JobDescription>
    - RoleOverview
    - Responsibilities
    - Requirements
    - Benefits
    - CompanyCulture

  <CompanyInsights>
    - ScrapedCompanyData
    - RecentNews
    - EmployeeReviews
    - CultureKeywords

  <ApplicationPanel>
    - GenerateCoverLetter
    - OptimizeCV
    - QuickApply
    - SaveForLater
```

### CV Builder (`/cv/builder`)
```
<CVBuilderLayout>
  <TemplateSelector>
    - SwedishProfessional
    - ModernMinimal
    - CreativeDesign
    - AcademicFormat
    - TechFocused

  <CVEditor>
    <PersonalInfo>
      - Photo (optional)
      - Name
      - Title
      - ContactInfo
      - PersonNumber (optional)

    <Summary>
      - AIGeneratedSummary
      - CustomEdit

    <Experience>
      - JobEntries
      - AIDescriptionEnhancer
      - SkillExtractor

    <Education>
      - DegreeEntries
      - Certifications
      - Courses

    <Skills>
      - TechnicalSkills
      - SoftSkills
      - Languages
      - SkillEndorsements

  <CVPreview>
    - LiveTypstPreview
    - DownloadPDF
    - ShareLink
```

### Cover Letter Generator (`/cover-letter/generate`)
```
<CoverLetterLayout>
  <InputPanel>
    - SelectJob
    - ToneSelector (formal/casual/enthusiastic)
    - LengthPreference
    - KeyPointsToEmphasize

  <CompanyResearch>
    - AutoScrapedInfo
    - CompanyValues
    - RecentAchievements
    - TeamStructure

  <GenerationPanel>
    - GenerateButton
    - RegenerateOptions
    - EditInline
    - SaveTemplate

  <PreviewPanel>
    - FormattedLetter
    - MatchingKeywords
    - SwedishGrammarCheck
```

---

## Core Components Library

### Form Components
- `ChatInput` - Conversational form interface
- `ProgressiveProfileForm` - Multi-step profiling
- `FileUploader` - CV/document upload with parsing
- `LinkedInImporter` - OAuth + data extraction
- `SkillsAutocomplete` - Semantic skill matching
- `SalaryRangeSlider` - Dual handle with currency

### Data Display
- `JobCard` - Compact job listing
- `MatchScoreCircle` - Visual match percentage
- `SkillsRadar` - Skills gap visualization
- `ApplicationTimeline` - Status tracker
- `CVPreview` - Embedded PDF viewer
- `CompanyCard` - Employer branding display

### AI Components
- `ChatProfiler` - Conversational data collection
- `SmartSuggestions` - Context-aware hints
- `LoadingWithTips` - Educational loading states
- `GenerationFeedback` - Rate AI output
- `RegenerationOptions` - Tweak AI parameters

### Navigation
- `MainNav` - Responsive top navigation
- `DashboardSidebar` - Collapsible side menu
- `MobileBottomNav` - Mobile-first navigation
- `BreadCrumbs` - Location indicator
- `SearchCommand` - Cmd+K search palette

### Feedback
- `MatchExplanation` - Why this match percentage
- `ApplicationStatusBadge` - Visual status
- `OnboardingProgress` - Completion tracker
- `SuccessMetrics` - Achievement displays
- `FeedbackModal` - User input collection

---

## Data Models (High Level)

### User Profile
```typescript
UserProfile {
  // Basic
  id, email, name, phone, location
  personalNumber (optional)
  profilePhoto
  
  // Professional
  currentTitle, desiredTitles[]
  yearsExperience
  industries[]
  
  // Preferences
  jobTypes[] (remote/hybrid/onsite)
  salaryExpectation
  startAvailability
  locationPreferences[]
  
  // Data
  linkedinData
  uploadedCV
  generatedCVs[]
  coverLetterTemplates[]
  
  // Vectors
  skillsEmbedding
  experienceEmbedding
  preferencesEmbedding
}
```

### Job Listing
```typescript
JobListing {
  // Core
  id, title, company, location
  description, requirements
  
  // Metadata
  postedDate, deadline
  salaryRange, jobType
  experienceLevel
  
  // Swedish Specific
  collectiveAgreement
  languageRequirements
  
  // AI Enhanced
  descriptionEmbedding
  extractedSkills[]
  companyCulture
  
  // Scraping
  companyWebsiteData
  lastScrapedAt
}
```

### Application
```typescript
Application {
  userId, jobId
  status (draft/sent/viewed/rejected/interview)
  
  coverLetter
  cvVersion
  
  appliedAt
  lastStatusChange
  
  matchScore
  matchExplanation
  
  followUpSchedule[]
  notes
}
```

---

## API Endpoints (High Level)

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/verify-email`

### Profile
- `GET /profile`
- `PUT /profile`
- `POST /profile/import-linkedin`
- `POST /profile/parse-cv`
- `POST /profile/chat-update`

### Jobs
- `GET /jobs/search` (with semantic search)
- `GET /jobs/recommendations`
- `GET /jobs/{id}`
- `POST /jobs/{id}/match-analysis`
- `POST /jobs/{id}/save`

### Applications
- `POST /applications/create`
- `GET /applications`
- `PUT /applications/{id}/status`
- `POST /applications/bulk-apply`

### Generation
- `POST /cv/generate`
- `POST /cv/optimize-for-job`
- `POST /cover-letter/generate`
- `POST /cover-letter/regenerate`

### Scraping
- `POST /scraping/company-research`
- `GET /scraping/company/{domain}`

### Subscription
- `POST /subscription/create-checkout`
- `POST /subscription/cancel`
- `GET /subscription/status`

---

## Feature Prioritization

### Phase 1: MVP (Months 1-2)
✅ User registration/login
✅ Basic profile creation
✅ Job search with filters
✅ Semantic job matching
✅ CV generation (Typst)
✅ Basic cover letter generation

### Phase 2: Core Features (Months 3-4)
✅ LinkedIn import
✅ Chat-based profiling
✅ Company research/scraping
✅ Application tracking
✅ Saved searches
✅ Email notifications

### Phase 3: Premium Features (Months 5-6)
✅ Bulk applications (limited)
✅ Advanced CV templates
✅ Interview preparation
✅ Salary insights
✅ Priority support
✅ API rate limit increases

### Phase 4: B2B Features (Months 7-12)
✅ Employer accounts
✅ Job posting
✅ Candidate search
✅ Application management
✅ Analytics dashboard
✅ Team collaboration

---

## Key User Interactions

### Onboarding Decision Tree
```
New User Lands
  ├─> "Import LinkedIn" → OAuth → Extract → Confirm
  ├─> "Upload CV" → Parse → Extract → Enhance
  └─> "Start Fresh" → Chat → Progressive Questions → Build Profile
```

### Job Application Flow
```
See Job → Check Match % → View Details
  ├─> "Quick Apply" → Use existing CV + Generate Letter → Send
  ├─> "Customize" → Optimize CV → Write Letter → Review → Send
  └─> "Save" → Add to saved → Set reminder → Apply later
```

### Daily Active User Loop
```
Email/Push → New Matches → Dashboard
  ├─> Review matches → Apply to best
  ├─> Check application status → Follow up
  └─> Update profile → Improve matching
```

---

## Mobile Considerations

### Priority Mobile Views
1. Job swipe cards (Tinder-style)
2. Application status dashboard
3. Quick apply flow
4. Profile completion
5. Saved jobs list

### Desktop-First Features
1. CV builder/editor
2. Cover letter generator
3. Detailed job research
4. Bulk operations
5. Analytics dashboards

---

## Internationalization

### Launch Languages
- Swedish (primary)
- English (secondary)

### Localized Content
- CV formats per country
- Cultural tone adjustments
- Local job board integrations
- Currency/salary norms
- Legal compliance text
