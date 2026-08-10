# Implementation Roadmap

## Zelosify - Multi-Tenant AI-Assisted Hiring Platform

---

## Phase 0: Environment Setup
**Status:** ✅ Complete | **Priority:** High

### 0.1 Infrastructure (Docker Compose)
- [x] PostgreSQL 16 (pinned from latest due to data dir changes)
- [x] Keycloak (auth provider)
- [x] MinIO (S3-compatible storage, replaced LocalStack)

| Service | Status | Port | Notes |
|---------|--------|------|-------|
| PostgreSQL | ✅ Healthy | 5445 | Pinned to v16 |
| Keycloak | ✅ Running | 8180 | Port changed from 8080 (Windows reserved) |
| MinIO | ✅ Healthy | 9000/9001 | Console at 9001 |
| Backend | ✅ Running | 5000 | Express + Prisma + TypeScript |
| Frontend | ✅ Running | 3000 | Next.js (changed from 5173) |

### 0.2 Keycloak Configuration
- [x] Realm: Zelosify (created via admin API)
- [x] Client: dynamic-client (confidential, direct access grants, service accounts)
- [x] Client Secret: Retrieved and saved to .env
- [x] RS256 Signature Key: Retrieved and saved to .env
- [x] Access Token Lifespan: Increased to 6 hours
- [x] Realm Roles: IT_VENDOR, HIRING_MANAGER, BUSINESS_USER, VENDOR_MANAGER

### 0.3 Database Setup
- [x] Prisma migrations applied
- [x] Tenant created: "Bruce Wayne Corp" (ID: c36a8dbf-a102-4737-b248-61a875e56ef6)

### 0.4 Users Registered
| User | Email | Role | Password |
|------|-------|------|----------|
| admin | admin@brucewayne.com | HIRING_MANAGER | Admin@1234 |
| vendor1 | vendor1@example.com | IT_VENDOR | Vendor@1234 |

### 0.5 S3 Storage (MinIO)
- [x] Bucket: zelosify-uploads
- [x] Credentials: minioadmin/minioadmin
- [x] Endpoint: http://localhost:9000

### 0.6 Code Changes Made
- [x] Root package.json (concurrently for monorepo)
- [x] Frontend port: 5173 → 3000
- [x] Backend CORS: localhost:5173 → localhost:3000
- [x] docker-compose.yml: postgres:16, MinIO instead of LocalStack
- [x] awsStorageService.ts: Read S3_ENDPOINT from env
- [x] keycloak.ts: Added dotenv.config() for env loading
- [x] localLogin.ts: Bypass TOTP in development mode
- [x] .env files created (backend + frontend)
- [x] .gitignore updated

### 0.7 Documentation
- [x] docs/Round_One_Task.md (full assignment requirements)
- [x] docs/Setup_Guide.md (complete setup guide)
- [x] docs/Project_Progress.md (session summary)
- [x] docs/Roadmap.md (this file)

### 0.8 Skills Installed
- [x] read (tw93/waza) - For reading PDF/DOCX files

---

## Phase 1: Database Schema & Seeding
**Status:** ✅ Complete | **Priority:** High

### 1.1 Prisma Schema Updates
- [x] Add `Opening` model to schema.prisma
- [x] Add `hiringProfile` model to schema.prisma
- [x] Add `OpeningStatus` enum (OPEN, CLOSED, ON_HOLD)
- [x] Add `ProfileStatus` enum (SUBMITTED, SHORTLISTED, REJECTED)
- [x] Add proper indexes (tenantId, openingId, recommended)

**Schema additions:**
```prisma
model Opening {
  id                    String           @id @default(uuid())
  tenantId              String
  title                 String
  description           String
  location              String
  contractType          String
  hiringManagerId       String
  experienceMin         Int
  experienceMax         Int
  postedDate            DateTime         @default(now())
  expectedCompletionDate DateTime?
  actionDate            DateTime?
  status                OpeningStatus    @default(OPEN)
  hiringProfiles        hiringProfile[]
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  @@index([tenantId])
  @@index([hiringManagerId])
}

model hiringProfile {
  id                       Int       @id @default(autoincrement())
  openingId                String
  s3Key                    String
  uploadedBy               String
  submittedAt              DateTime  @default(now())
  status                   ProfileStatus @default(SUBMITTED)
  shortlistedBy            String?
  shortlistedAt            DateTime?
  rejectedBy               String?
  rejectedAt               DateTime?
  recommended              Boolean?
  recommendationScore      Float?
  recommendationReason     String?
  recommendationLatencyMs  Int?
  recommendationVersion    String?
  recommendationConfidence Float?
  recommendedAt            DateTime?
  isDeleted                Boolean   @default(false)
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt

  opening Opening @relation(fields: [openingId], references: [id])

  @@index([openingId])
  @@index([uploadedBy])
  @@index([recommended])
}
```

### 1.2 Database Migration
- [x] Tables created via raw SQL (Keycloak tables in same DB prevented prisma migrate)
- [x] Verified all tables created correctly

### 1.3 Seed Data
- [x] Created seed script: `prisma/seed.ts`
- [x] 14 openings created for "Bruce Wayne Corp" tenant
- [x] Different roles, experience ranges, contract types
- [x] Assign hiring managers to openings

**Seed script locations:**
- `Zelosify-Backend/Server/prisma/seed.ts`

**Seeded openings:**
| Title | Location | Type | Experience |
|-------|----------|------|------------|
| Senior React Developer | New York, NY | Full-Time | 5-10 |
| Backend Node.js Engineer | Remote | Full-Time | 4-8 |
| DevOps Engineer | San Francisco, CA | Contract | 3-7 |
| Junior Frontend Developer | Austin, TX | Full-Time | 1-3 |
| Senior Cloud Architect | Seattle, WA | Contract | 8-12 |
| AI/ML Engineer | Remote | Contract | 4-10 |
| Security Engineer | Washington, DC | Full-Time | 4-8 |
| Full Stack Developer | Portland, OR | Full-Time | 3-7 |
| Technical Lead | New York, NY | Full-Time | 8-15 |
| Database Administrator | Denver, CO | Contract | 5-10 |
| And 4 more... | | | |

---

## Phase 2: IT Vendor Backend APIs
**Status:** ✅ Complete | **Priority:** High

### 2.1 Fetch Openings
- [x] `GET /api/v1/vendor/openings`
- [x] Pagination required (offset/limit)
- [x] Tenant filtering mandatory
- [x] Include hiring manager name

### 2.2 Fetch Opening Details
- [x] `GET /api/v1/vendor/openings/:id`
- [x] Include: Hiring Manager name, experience range, profiles count
- [x] Include uploaded profiles list

### 2.3 Presign Upload URLs
- [x] `POST /api/v1/vendor/openings/:id/profiles/presign`
- [x] Generate S3 presigned URLs
- [x] Path: `<tenantId>/<openingId>/<timestamp>_<filename>`
- [x] Support PDF and DOCX

### 2.4 Submit Profiles
- [x] `POST /api/v1/vendor/openings/:id/profiles/upload`
- [x] Use Prisma transaction
- [x] Create hiringProfile record
- [x] Store S3 key

### 2.5 Delete Profiles
- [x] `DELETE /api/v1/vendor/openings/:openingId/profiles/:profileId`
- [x] Soft delete (sets isDeleted = true)
- [x] Only allows deletion of own profiles

**Files created/modified:**
- `Zelosify-Backend/Server/src/routers/vendor/vendorOpeningRoutes.ts` (new)
- `Zelosify-Backend/Server/src/routers/vendor/vendorRoutes.ts` (modified)

**API Response Examples:**

**GET /api/v1/vendor/openings**
```json
{
  "openings": [
    {
      "id": "382e97f4-0679-4b06-8a3a-82ded91f4bd0",
      "tenantId": "c36a8dbf-a102-4737-b248-61a875e56ef6",
      "title": "Database Administrator",
      "description": "Manage and optimize database systems.",
      "location": "Denver, CO",
      "contractType": "Contract",
      "experienceMin": 5,
      "experienceMax": 10,
      "postedDate": "2026-08-09T10:19:13.434Z",
      "status": "OPEN",
      "profilesCount": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 14,
    "totalPages": 2
  }
}
```

**POST /api/v1/vendor/openings/:id/profiles/presign**
```json
{
  "presignedUrl": "http://localhost:9000/zelosify-uploads/...",
  "s3Key": "c36a8dbf-a102-4737-b248-61a875e56ef6/382e97f4-.../1786273496568_resume.pdf"
}
```

---

## Phase 3: IT Vendor Frontend
**Status:** ✅ Complete | **Priority:** High

### 3.1 Openings List Page
- [x] Route: `/vendor/openings`
- [x] Card-based layout (not table)
- [x] Shows: Title, Location, Contract Type, Status, Profiles Count
- [x] Search/filter functionality
- [x] Pagination controls
- [x] Responsive design
- [x] Loading skeleton

### 3.2 Opening Details Page
- [x] Route: `/vendor/openings/:id`
- [x] Display opening details with status badge
- [x] Upload section with file selector
- [x] File validation (PDF/DOCX, max 10MB)
- [x] Presigned URL upload flow
- [x] Submitted profiles list with status
- [x] Soft delete support
- [x] Light & dark theme
- [x] Success feedback after upload

### 3.3 Sidebar Integration
- [x] Added "Openings" menu item for IT_VENDOR role
- [x] Uses Briefcase icon from lucide-react

**Files created:**
- `Zelosify-Frontend/src/app/(UserDashBoard)/vendor/openings/page.jsx`
- `Zelosify-Frontend/src/app/(UserDashBoard)/vendor/openings/[id]/page.jsx`

**Files modified:**
- `Zelosify-Frontend/src/components/UserDashboardPage/SideBar/Routes/ItemRoutes.jsx`

---

## Phase 4: Hiring Manager Backend APIs
**Status:** ✅ Complete | **Priority:** High

### 4.1 Fetch Openings
- [x] `GET /api/v1/hiring-manager/openings`
- [x] Only own openings (tenant filtering)
- [x] Include profile stats (submitted, shortlisted, rejected)

### 4.2 Fetch Opening Details
- [x] `GET /api/v1/hiring-manager/openings/:id`
- [x] Include all profiles with recommendation data

### 4.3 Shortlist Profile
- [x] `PATCH /api/v1/hiring-manager/openings/:openingId/profiles/:profileId/shortlist`
- [x] Verify tenant ownership
- [x] Update profile status to SHORTLISTED
- [x] Record who shortlisted and when

### 4.4 Reject Profile
- [x] `PATCH /api/v1/hiring-manager/openings/:openingId/profiles/:profileId/reject`
- [x] Verify tenant ownership
- [x] Update profile status to REJECTED
- [x] Record who rejected and when

### 4.5 Update Profile Status
- [x] `PATCH /api/v1/hiring-manager/openings/:openingId/profiles/:profileId/status`
- [x] Generic status update endpoint
- [x] Validates status values

**Files modified:**
- `Zelosify-Backend/Server/src/routers/hiring/hiringManagerRoutes.ts` (extended)

**API Response Examples:**

**GET /api/v1/hiring-manager/openings**
```json
{
  "openings": [
    {
      "id": "382e97f4-0679-4b06-8a3a-82ded91f4bd0",
      "title": "Database Administrator",
      "location": "Denver, CO",
      "contractType": "Contract",
      "status": "OPEN",
      "stats": {
        "totalProfiles": 2,
        "submitted": 1,
        "shortlisted": 0,
        "rejected": 1
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 14,
    "totalPages": 2
  }
}
```

**PATCH /api/v1/hiring-manager/openings/:openingId/profiles/:profileId/shortlist**
```json
{
  "message": "Profile shortlisted successfully",
  "profile": {
    "id": 1,
    "status": "SHORTLISTED",
    "shortlistedBy": "c8d6c5fb-c40d-4dd6-8327-7ace2669db31",
    "shortlistedAt": "2026-08-09T11:09:22.258Z"
  }
}
```

---

## Phase 5: Hiring Manager Frontend
**Status:** ✅ Complete | **Priority:** High

### 5.1 Openings List Page
- [x] Route: `/hiring-manager/openings`
- [x] Card-based layout
- [x] Shows profile stats (total, shortlisted, rejected)
- [x] Search/filter functionality
- [x] Pagination controls
- [x] Responsive design

### 5.2 Opening Detail Page
- [x] Route: `/hiring-manager/openings/:id`
- [x] Profile cards showing:
  - [x] Profile ID
  - [x] Upload date
  - [x] Status badge (Submitted/Shortlisted/Rejected)
  - [x] AI Score (when available)
  - [x] Shortlist button
  - [x] Reject button
- [x] Filter by status (All/Submitted/Shortlisted/Rejected)
- [x] Disabled actions for non-Submitted profiles

### 5.3 Sidebar Integration
- [x] Added "Openings" menu item for HIRING_MANAGER role
- [x] Uses Briefcase icon from lucide-react

**Files created:**
- `Zelosify-Frontend/src/app/(UserDashBoard)/hiring-manager/openings/page.jsx`
- `Zelosify-Frontend/src/app/(UserDashBoard)/hiring-manager/openings/[id]/page.jsx`

**Files modified:**
- `Zelosify-Frontend/src/components/UserDashboardPage/SideBar/Routes/ItemRoutes.jsx`

---

## Phase 6: AI Recommendation Agent
**Status:** ✅ Complete | **Priority:** Critical

### 6.1 Agent Architecture
- [x] Tool Registry pattern (4 tools registered)
- [x] Agent Orchestrator (runAgent) — step-by-step execution
- [x] Controller does not contain business logic

### 6.2 Tool Registry
- [x] `resume_parsing` — Extracts skills, experience, education, location from S3 file
- [x] `feature_extraction` — Computes feature vector (skill/experience/location scores)
- [x] `skill_normalization` — Deduplicates and maps skill synonyms (JS→JavaScript, etc.)
- [x] `scoring_engine` — Deterministic scoring: `0.5*skill + 0.3*experience + 0.2*location`

### 6.3 Schema Validation (Zod)
- [x] FeatureVectorSchema — validates feature vectors
- [x] ScoringResultSchema — validates scoring output
- [x] AgentDecisionSchema — validates LLM output
- [x] ParsedResumeSchema — validates parsed resume data
- [x] `validateWithRetry()` — retries validation up to 2 times on failure

### 6.4 Prompt Injection Mitigation
- [x] `sanitizeForLLM()` — strips `<>` characters
- [x] Redacts keywords: ignore, disregard, forget, override, system, assistant, user
- [x] Truncates input to 5000 chars max
- [x] Resume content never directly injected into system prompts

### 6.5 Retry Logic
- [x] `invokeLLMWithRetry()` — 3 retries on LLM API failures
- [x] Exponential backoff (attempt * 500ms)
- [x] Falls back to deterministic scoring on LLM failure

### 6.6 Internal Reasoning State
- [x] Agent maintains step-by-step state through ToolRegistry invocations
- [x] Each tool result is validated before passing to next step

### 6.7 Logging & Observability
- [x] Structured JSON logging for all agent activity
- [x] parseTimeMs, featureTimeMs, scoringTimeMs, totalLatencyMs logged
- [x] Token usage logged when LLM is used
- [x] Decision threshold logged (Recommended/Borderline/Not Recommended)

### 6.8 Persist Intermediate Metadata
- [x] recommendationScore, recommendationReason, recommendationLatencyMs
- [x] recommendationVersion ("agent-deterministic-v1" or "agent-llm-{provider}-v1")
- [x] recommendationConfidence, recommendedAt timestamp
- [x] All persisted in Prisma transaction

### 6.9 Deterministic Scoring Engine
- [x] Formula: `0.5*skill + 0.3*experience + 0.2*location`
- [x] Skill match: overlap / requiredSkills
- [x] Experience: below min→0, within range→1, above max→0.8
- [x] Location: Remote→1, exact match→1, mismatch→0.4

### 6.10 Decision Thresholds
- [x] Score ≥ 0.75 → "Recommended"
- [x] Score 0.5–0.74 → "Borderline"
- [x] Score < 0.5 → "Not Recommended"

### 6.11 LLM Integration (Optional)
- [x] Gemini provider (gemini-1.5-flash)
- [x] Groq provider (llama3-8b-8192)
- [x] Factory pattern for provider selection
- [x] `useLLM` flag to toggle LLM vs deterministic
- [x] Default: deterministic only (useLLM=false)

### 6.12 API Endpoints
- [x] `POST /api/v1/ai/recommend/:openingId` - Batch processing
- [x] `POST /api/v1/ai/recommend/:openingId/:profileId` - Single profile
- [x] Auto-trigger on profile SUBMITTED by IT_VENDOR

### 6.13 Performance Requirements
- [x] Average latency: ~10ms per profile (requirement: ≤1500ms) ✅
- [x] P95 latency: ~10ms (requirement: ≤2000ms) ✅
- [x] All latencies stored in DB

**Environment Variables:**
```env
GEMINI_API_KEY=<your_key>
GROQ_API_KEY=<your_key>
LLM_PROVIDER=gemini  # or groq
```

**Files created:**
- `Zelosify-Backend/Server/src/services/ai/recommendationAgent.ts`
- `Zelosify-Backend/Server/src/services/ai/schema.ts`
- `Zelosify-Backend/Server/src/services/ai/logger.ts`
- `Zelosify-Backend/Server/src/services/ai/parsing/resumeParser.ts`
- `Zelosify-Backend/Server/src/services/ai/llm/llmProvider.ts`
- `Zelosify-Backend/Server/src/services/ai/llm/geminiProvider.ts`
- `Zelosify-Backend/Server/src/services/ai/llm/groqProvider.ts`
- `Zelosify-Backend/Server/src/services/ai/llm/llmFactory.ts`
- `Zelosify-Backend/Server/src/routers/ai/aiRoutes.ts`

---

## Phase 7: Middleware & Auth Updates
**Status:** ✅ Complete | **Priority:** High

### 7.1 Frontend Middleware
- [x] Added HIRING_MANAGER role redirect
- [x] Added `/hiring-manager/:path*` to protected routes
- [x] Changed IT_VENDOR redirect from `/vendor/payments` to `/vendor/openings`

**Updated middleware logic:**
```javascript
case "IT_VENDOR":
  return NextResponse.redirect(new URL("/vendor/openings", request.url));

case "HIRING_MANAGER":
  return NextResponse.redirect(new URL("/hiring-manager/openings", request.url));
```

### 7.2 Landing Navbar
- [x] Check authentication state
- [x] Show profile circle when logged in
- [x] Show "Sign in" button when not logged in
- [x] Profile dropdown with Dashboard and Sign out options

**Files modified:**
- `Zelosify-Frontend/src/middleware.js`
- `Zelosify-Frontend/src/components/LandingPage/navbar/LandingNavbar.jsx`

---

## Phase 8: Testing
**Status:** ✅ Complete | **Priority:** High

### 8.1 API Testing
- [x] Vendor openings list API - Verified
- [x] Vendor presign URL API - Verified
- [x] Vendor profile upload API - Verified
- [x] Hiring manager openings list API - Verified
- [x] Hiring manager shortlist API - Verified
- [x] Hiring manager reject API - Verified
- [x] AI recommendation agent API - Verified

### 8.2 Frontend Testing
- [x] Login flow - admin (HIRING_MANAGER) - Verified
- [x] Login flow - vendor1 (IT_VENDOR) - Verified
- [x] Role-based redirect - Verified
- [x] Landing navbar profile display - Verified

### 8.3 Database Verification
- [x] Opening records created (14 total)
- [x] Profile records created
- [x] Recommendation data stored correctly

---

## Phase 9: Final Polish
**Status:** ✅ Complete | **Priority:** Medium

### 9.1 Error Handling
- [x] Global error handler in Express
- [x] Proper HTTP status codes (400, 401, 403, 404, 500)
- [x] User-friendly error messages

### 9.2 Security
- [x] JWT authentication on all protected routes
- [x] Role-based access control (RBAC)
- [x] Tenant isolation (queries filtered by tenantId)
- [x] Input validation

### 9.3 Documentation
- [x] API documentation in code comments
- [x] Roadmap updated (this file)

---

## Phase 10: Resume Parsing
**Status:** ✅ Complete | **Priority:** High

### 10.1 Resume Parser Service
- [x] Fetch PDF from S3 using `createStorageService().getObjectStream()`
- [x] Extract text using `pdf-extraction` package
- [x] Parse structured data from text

### 10.2 Skill Extraction
- [x] Regex patterns for 100+ technical skills
- [x] Categories: Languages, Frontend, Backend, Databases, Cloud, AI/ML, Tools
- [x] Case-insensitive matching

### 10.3 Experience Extraction
- [x] Parse "X years experience" patterns
- [x] Parse date ranges from work history
- [x] Return estimated years

### 10.4 Other Extractors
- [x] Education extraction
- [x] Location extraction
- [x] Email extraction
- [x] Phone extraction

**Files created:**
- `Zelosify-Backend/Server/src/services/ai/parsing/resumeParser.ts`

---

## Phase 11: LLM Integration
**Status:** ✅ Complete | **Priority:** High

### 11.1 LLM Provider Interface
- [x] Abstract `LLMProvider` interface
- [x] Factory pattern for provider selection

### 11.2 Gemini Provider
- [x] `@google/generative-ai` SDK integration
- [x] Model: `gemini-1.5-flash`

### 11.3 Groq Provider
- [x] `groq-sdk` integration
- [x] Model: `llama3-8b-8192`

### 11.4 LLM Factory
- [x] Provider selection via env var `LLM_PROVIDER`
- [x] Fallback to deterministic scoring if no API key

### 11.5 Updated Recommendation Agent
- [x] Use real parsed resume data
- [x] LLM-powered scoring with detailed reasoning
- [x] `useLLM` flag to toggle LLM vs deterministic

**Environment Variables:**
```env
GEMINI_API_KEY=<your_key>
GROQ_API_KEY=<your_key>
LLM_PROVIDER=gemini  # or groq
```

**Files created:**
- `Zelosify-Backend/Server/src/services/ai/llm/llmProvider.ts`
- `Zelosify-Backend/Server/src/services/ai/llm/geminiProvider.ts`
- `Zelosify-Backend/Server/src/services/ai/llm/groqProvider.ts`
- `Zelosify-Backend/Server/src/services/ai/llm/llmFactory.ts`

---

## Phase 12: Profile Notes
**Status:** ✅ Complete | **Priority:** Medium

### 12.1 Database
- [x] Added `ProfileNote` model to Prisma schema
- [x] Created table via raw SQL

### 12.2 API Endpoints
- [x] `GET /api/v1/hiring-manager/profiles/:id/notes` - List notes
- [x] `POST /api/v1/hiring-manager/profiles/:id/notes` - Add note
- [x] `DELETE /api/v1/hiring-manager/profiles/:id/notes/:noteId` - Delete note

### 12.3 Frontend
- [x] Notes section in opening details page
- [x] Text input for new notes
- [x] Notes list with author and timestamp
- [x] Delete button (author only)

**Files modified:**
- `Zelosify-Backend/Server/src/routers/hiring/hiringManagerRoutes.ts`
- `Zelosify-Frontend/src/app/(UserDashBoard)/hiring-manager/openings/[id]/page.jsx`

---

## Phase 13: Email Notifications
**Status:** ✅ Complete | **Priority:** Medium

### 13.1 Email Service
- [x] Nodemailer integration
- [x] SMTP configuration via env vars
- [x] HTML email templates

### 13.2 Notification Types
- [x] Profile shortlisted → Vendor
- [x] Profile rejected → Vendor
- [x] New profile submitted → Hiring Manager

### 13.3 Integration
- [x] Send email on shortlist
- [x] Send email on reject

**Environment Variables:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
FRONTEND_URL=http://localhost:3000
```

**Files created:**
- `Zelosify-Backend/Server/src/services/notification/emailService.ts`

---

## Phase 14: Unit Tests
**Status:** ✅ Complete | **Priority:** Medium

### 14.1 Resume Parser Tests
- [x] Skill extraction tests
- [x] Experience extraction tests
- [x] Email extraction tests

### 14.2 Scoring Engine Tests
- [x] Skill matching tests
- [x] Experience matching tests
- [x] Location matching tests
- [x] Overall score calculation tests

### 14.3 Test Results
- [x] 25 tests passing
- [x] All tests complete in <1s

**Files created:**
- `Zelosify-Backend/Server/tests/unit/resumeParser.test.ts`
- `Zelosify-Backend/Server/tests/unit/scoring.test.ts`

---

## Phase 15: Dashboard Analytics
**Status:** ✅ Complete | **Priority:** Low

### 15.1 Analytics API
- [x] `GET /api/v1/analytics/dashboard` - Aggregated stats

### 15.2 Stats Provided
- [x] Openings by status
- [x] Profiles by status
- [x] Recent activity (last 7 days)
- [x] AI recommendation stats

**Files created:**
- `Zelosify-Backend/Server/src/routers/analytics/analyticsRoutes.ts`

---

## Phase 16: Landing Page
**Status:** ✅ Complete | **Priority:** Medium

### 16.1 Hero Section
- [x] Dark theme (`bg-gray-950`)
- [x] Ambient glow effects (blue/purple orbs)
- [x] Grid overlay
- [x] Large white heading text
- [x] Dark glassmorphism navbar (`bg-gray-900/80 backdrop-blur-lg`)
- [x] Dark mobile menu (`bg-gray-950/95 backdrop-blur-xl`)

**Files modified:**
- `Zelosify-Frontend/src/pages/LandingPage/LandingPage.jsx`
- `Zelosify-Frontend/src/components/LandingPage/navbar/LandingNavbar.jsx`
- `Zelosify-Frontend/src/components/LandingPage/MobileMenu.jsx`

---

## Phase 17: Clean Architecture Refactoring
**Status:** ✅ Complete | **Priority:** High

### 17.1 Domain Layer
- [x] Entities: User, Opening, CandidateProfile, Score, ProfileNote, Tenant
- [x] Enums: OpeningStatus, ProfileStatus, Role, AuthProvider
- [x] Errors: DomainError, NotFoundError, UnauthorizedError, ForbiddenError
- [x] `toJSON()` methods on all entities

### 17.2 Ports Layer
- [x] Repository interfaces: IOpeningRepository, ICandidateRepository, IUserRepository, INoteRepository, ITenantRepository
- [x] Service interfaces: IAuthService, IEmailService, IStorageService

### 17.3 Adapters Layer
- [x] Prisma repositories: PrismaOpeningRepository, PrismaCandidateRepository, PrismaUserRepository, PrismaNoteRepository, PrismaTenantRepository
- [x] KeycloakAuthService
- [x] NodemailerEmailService
- [x] StorageServiceAdapter

### 17.4 Use Cases Layer
- [x] ListOpenings, GetOpeningDetails (with uploader name enrichment)
- [x] SubmitProfile, GeneratePresignedUrl, DeleteProfile
- [x] ShortlistProfile, RejectProfile, UpdateProfileStatus
- [x] GetNotes, AddNote, DeleteNote
- [x] GetDashboardStats

### 17.5 Controllers Layer
- [x] AuthController, VendorController, ProfileController
- [x] HiringManagerController (with view profile endpoint)
- [x] AIController, AnalyticsController

### 17.6 Frameworks Layer
- [x] DI container (container.ts)
- [x] App factory (app.ts)
- [x] Clean routes: auth, vendor, hiring-manager, AI, analytics

**Files created:**
- `Zelosify-Backend/Server/src/domain/entities/index.ts`
- `Zelosify-Backend/Server/src/domain/enums/index.ts`
- `Zelosify-Backend/Server/src/domain/errors/index.ts`
- `Zelosify-Backend/Server/src/ports/repositories/*.ts`
- `Zelosify-Backend/Server/src/ports/services/*.ts`
- `Zelosify-Backend/Server/src/adapters/repositories/*.ts`
- `Zelosify-Backend/Server/src/adapters/services/*.ts`
- `Zelosify-Backend/Server/src/usecases/opening/*.ts`
- `Zelosify-Backend/Server/src/usecases/candidate/*.ts`
- `Zelosify-Backend/Server/src/usecases/analytics/*.ts`
- `Zelosify-Backend/Server/src/controllers/express/*.ts`
- `Zelosify-Backend/Server/src/frameworks/di/container.ts`
- `Zelosify-Backend/Server/src/frameworks/express/app.ts`
- `Zelosify-Backend/Server/src/frameworks/routes/*.ts`

---

## Phase 18: Custom Dialogs & Toast Notifications
**Status:** ✅ Complete | **Priority:** Medium

### 18.1 ConfirmDialog Component
- [x] Reusable AlertDialog component using shadcn/ui + Radix
- [x] Supports destructive variant (red confirm button)
- [x] Customizable title, description, confirm/cancel text
- [x] Dark mode support

### 18.2 Toast Notifications
- [x] Replaced all `alert()` with sonner toast notifications
- [x] Success toasts for: upload, shortlist, reject, delete
- [x] Error toasts for: failed operations, validation errors
- [x] Uses existing sonner Toaster (already in AllProvider)

### 18.3 Vendor Page Updates
- [x] Delete profile: ConfirmDialog (destructive) + toast.success
- [x] File validation errors: toast.error
- [x] Upload failure: toast.error

### 18.4 Hiring Manager Page Updates
- [x] Delete note: ConfirmDialog (destructive) + toast.success
- [x] Shortlist: toast.success + refresh
- [x] Reject: toast.success + refresh
- [x] View profile: toast.error if file not found
- [x] Add note failure: toast.error

**Files created:**
- `Zelosify-Frontend/src/components/UI/ConfirmDialog.jsx`

**Files modified:**
- `Zelosify-Frontend/src/app/(UserDashBoard)/vendor/openings/[id]/page.jsx`
- `Zelosify-Frontend/src/app/(UserDashBoard)/hiring-manager/openings/[id]/page.jsx`

---

## Phase 19: Hiring Manager Enhancements
**Status:** ✅ Complete | **Priority:** High

### 19.1 Uploader Name Enrichment
- [x] `GetOpeningDetails` use case joins with User table
- [x] Returns `uploaderName` and `uploaderEmail` for manager view
- [x] Vendor view (with userId) skips enrichment

### 19.2 Profile File Preview
- [x] `GET /api/v1/hiring-manager/profiles/:profileId/view` endpoint
- [x] Returns presigned URL for file access
- [x] Graceful handling when file not found in storage
- [x] Eye icon button on each profile card
- [x] Opens file in new browser tab

### 19.3 Profile Card Enhancements
- [x] Shows uploader name with User icon
- [x] View button (eye icon) for file preview
- [x] All existing fields preserved (AI score, confidence, latency, etc.)

---

## Phase 20: Test Data Generation
**Status:** ✅ Complete | **Priority:** Medium

### 20.1 Test Resume Generator
- [x] Node.js script using `pdfkit` for PDF generation
- [x] Node.js script using `pptxgenjs` for PPTX generation
- [x] 3 candidates: Tharusha (Senior Frontend), Sahan (Backend), Kanishka (Junior Full-Stack)
- [x] US locations matching seeded openings
- [x] Realistic skills, experience, education

### 20.2 Generated Files
| File | Type | Candidate | Location |
|------|------|-----------|----------|
| tharusha_resume.pdf | PDF | Tharusha Perera | New York, NY |
| tharusha_resume.pptx | PPTX | Tharusha Perera | New York, NY |
| sahan_resume.pdf | PDF | Sahan Wickramasinghe | San Francisco, CA |
| sahan_resume.pptx | PPTX | Sahan Wickramasinghe | San Francisco, CA |
| kanishka_resume.pdf | PDF | Kanishka Fernando | Austin, TX |
| kanishka_resume.pptx | PPTX | Kanishka Fernando | Austin, TX |

**Files created:**
- `Zelosify-Backend/Server/scripts/generate-test-resumes.cjs`
- `Zelosify-Backend/Server/scripts/generate-test-pptx.cjs`
- `Zelosify-Backend/Server/test-profiles/*.pdf`
- `Zelosify-Backend/Server/test-profiles/*.pptx`

---

## Execution Order

```
Phase 0: Environment Setup ✅
    ↓
Phase 1: Database Schema & Seeding ✅
    ↓
Phase 2: IT Vendor Backend APIs ✅
    ↓
Phase 3: IT Vendor Frontend ✅
    ↓
Phase 4: Hiring Manager Backend APIs ✅
    ↓
Phase 5: Hiring Manager Frontend ✅
    ↓
Phase 6: AI Recommendation Agent ✅
    ↓
Phase 7: Middleware & Auth Updates ✅
    ↓
Phase 8: Testing ✅
    ↓
Phase 9: Final Polish ✅
    ↓
Phase 10: Resume Parsing ✅
    ↓
Phase 11: LLM Integration ✅
    ↓
Phase 12: Profile Notes ✅
    ↓
Phase 13: Email Notifications ✅
    ↓
Phase 14: Unit Tests ✅
    ↓
Phase 15: Dashboard Analytics ✅
    ↓
Phase 16: Landing Page ✅
    ↓
Phase 17: Clean Architecture Refactoring ✅
    ↓
Phase 18: Custom Dialogs & Toast Notifications ✅
    ↓
Phase 19: Hiring Manager Enhancements ✅
    ↓
Phase 20: Test Data Generation ✅
```

---

## Complete API Reference

### Vendor APIs (IT_VENDOR role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vendor/openings` | List openings (paginated) |
| GET | `/api/v1/vendor/openings/:id` | Opening details with profiles |
| POST | `/api/v1/vendor/openings/:id/profiles/presign` | Get S3 presigned URL |
| POST | `/api/v1/vendor/openings/:id/profiles/upload` | Submit profile |
| DELETE | `/api/v1/vendor/openings/:openingId/profiles/:profileId` | Soft delete profile |

### Hiring Manager APIs (HIRING_MANAGER role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hiring-manager/openings` | List openings with stats |
| GET | `/api/v1/hiring-manager/openings/:id` | Opening details with profiles + uploader names |
| GET | `/api/v1/hiring-manager/profiles/:profileId/view` | Get presigned URL for file preview |
| PATCH | `/api/v1/hiring-manager/openings/:openingId/profiles/:profileId/shortlist` | Shortlist profile |
| PATCH | `/api/v1/hiring-manager/openings/:openingId/profiles/:profileId/reject` | Reject profile |
| PATCH | `/api/v1/hiring-manager/openings/:openingId/profiles/:profileId/status` | Update profile status |

### AI APIs (HIRING_MANAGER role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/recommend/:openingId` | Run AI agent (batch) |
| POST | `/api/v1/ai/recommend/:openingId/:profileId` | Run AI agent (single) |

---

## Frontend Routes

| Route | Role | Description |
|-------|------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Login page |
| `/register` | Public | Registration page |
| `/vendor/openings` | IT_VENDOR | List openings |
| `/vendor/openings/:id` | IT_VENDOR | Opening details + upload |
| `/hiring-manager/openings` | HIRING_MANAGER | List openings with stats |
| `/hiring-manager/openings/:id` | HIRING_MANAGER | Opening details + shortlist/reject |

---

## Key Files Reference

### Backend Structure
```
Zelosify-Backend/Server/src/
├── config/
│   ├── keycloak/keycloak.ts
│   └── prisma/prisma.ts
├── middlewares/
│   └── auth/
│       ├── authenticateMiddleware.ts
│       └── authorizeMiddleware.ts
├── routers/
│   ├── auth/authRoute.js
│   ├── vendor/
│   │   ├── vendorRoutes.ts
│   │   ├── vendorRequestRoutes.ts
│   │   └── vendorOpeningRoutes.ts
│   ├── hiring/
│   │   └── hiringManagerRoutes.ts
│   └── ai/
│       └── aiRoutes.ts
├── services/
│   ├── ai/
│   │   └── recommendationAgent.ts
│   └── storage/
│       └── aws/awsStorageService.ts
├── index.ts
└── seed.ts
```

### Frontend Structure
```
Zelosify-Frontend/src/
├── app/
│   └── (UserDashBoard)/
│       ├── vendor/
│       │   ├── openings/
│       │   │   ├── page.jsx
│       │   │   └── [id]/page.jsx
│       │   └── payments/page.jsx
│       └── hiring-manager/
│           └── openings/
│               ├── page.jsx
│               └── [id]/page.jsx
├── components/
│   ├── UserDashboardPage/
│   │   ├── Header/
│   │   │   ├── Header.jsx
│   │   │   └── UserProfile.jsx
│   │   └── SideBar/
│   │       └── Routes/ItemRoutes.jsx
│   └── LandingPage/
│       └── navbar/LandingNavbar.jsx
├── hooks/Auth/useAuth.js
├── middleware.js
└── redux/features/Auth/authSlice.js
```

---

## Environment Variables (.env)
```env
# Database
DATABASE_URL=postgresql://postgres:testrun@localhost:5445/zelosify_recruit_test

# Keycloak
KEYCLOAK_URL=http://localhost:8180/auth
KEYCLOAK_REALM=Zelosify
KEYCLOAK_CLIENT_ID=dynamic-client
KEYCLOAK_CLIENT_SECRET=<from Keycloak>
KEYCLOAK_RS256_SIG=<from Keycloak>

# Session
SESSION_SECRET=my-secret
JWT_SECRET=<from setup guide>

# AWS S3 (MinIO)
STORAGE_PROVIDER=aws
S3_AWS_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=zelosify-uploads
S3_ENDPOINT=http://localhost:9000
```

---

## Login Credentials
| User | Email | Role | Password |
|------|-------|------|----------|
| admin | admin@brucewayne.com | HIRING_MANAGER | Admin@1234 |
| vendor1 | vendor1@example.com | IT_VENDOR | Vendor@1234 |
| Keycloak Admin | admin | - | admin |

---

## Last Updated
- Date: 2026-08-10
- Status: All phases complete
- Current: Full contract hiring module + clean architecture + custom UI dialogs + test data generation
