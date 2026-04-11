# InterviewIQ -- Complete Build Specification

> **What is this?** A self-contained spec for building an AI-powered Interview Intelligence PDF generator.
> User pastes a job URL + has their CV on file → system scrapes, researches, analyzes → outputs a 20-page personalized interview prep PDF.
>
> **Business model:** Free account with 2 free PDFs, then $2/PDF via Stripe.
>
> **Build approach:** Agile. Start with core (URL → text output), then layer PDF, auth, payments.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Database Schema](#3-database-schema)
4. [Environment Variables](#4-environment-variables)
5. [Pipeline Architecture](#5-pipeline-architecture)
6. [API Routes](#6-api-routes)
7. [AI Prompts](#7-ai-prompts)
8. [PDF Template Structure](#8-pdf-template-structure)
9. [Pages and UI](#9-pages-and-ui)
10. [Payment Flow](#10-payment-flow)
11. [Build Phases (Agile)](#11-build-phases-agile)
12. [Cost Per PDF](#12-cost-per-pdf)
13. [Dependencies](#13-dependencies)

---

## 1. Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Framework | Next.js 15 (App Router, TypeScript) | Full-stack, serverless-ready |
| Styling | Tailwind CSS 4 + Shadcn/Radix | Fast, beautiful, accessible |
| Database | PostgreSQL via Neon | Free tier, serverless Postgres |
| DB driver | `pg` (raw queries) | Simple, no ORM overhead |
| Auth | NextAuth v5 (Credentials + Google) | Industry standard |
| Client state | TanStack React Query | Cache, polling, mutations |
| AI (extraction) | Claude Haiku via `@anthropic-ai/sdk` | Fast, cheap for parsing |
| AI (generation) | Claude Sonnet via `@anthropic-ai/sdk` | High quality for reports |
| Scraping | Jina Reader API (free, REST) | Clean markdown from any URL |
| Research | Perplexity Sonar API | Company intel, salary data |
| CV parsing | `pdf-parse` | Extract text from PDF |
| PDF rendering | Puppeteer (`@sparticuz/chromium`) | HTML/CSS → PDF, full design control |
| File storage | Vercel Blob | Store generated PDFs |
| Payments | Stripe (Checkout Sessions) | Industry standard |
| Hosting | Vercel | Zero-config Next.js hosting |

---

## 2. Project Structure

```
interviewiq/
├── app/
│   ├── (marketing)/              # Public pages
│   │   ├── page.tsx              # Landing page
│   │   └── pricing/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/                    # Auth-protected
│   │   ├── layout.tsx            # App shell (header, sidebar)
│   │   ├── onboarding/page.tsx   # CV upload + profile setup
│   │   ├── dashboard/page.tsx    # History, credits, actions
│   │   ├── generate/page.tsx     # Paste URL → progress → result
│   │   └── report/[id]/page.tsx  # View report in-app
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── onboarding/
│       │   ├── upload-cv/route.ts
│       │   ├── questions/route.ts
│       │   └── complete/route.ts
│       ├── generate/
│       │   ├── start/route.ts
│       │   └── status/[id]/route.ts
│       ├── report/
│       │   └── [id]/
│       │       ├── route.ts          # GET report JSON
│       │       └── pdf/route.ts      # GET PDF download
│       └── payments/
│           ├── checkout/route.ts
│           └── webhook/route.ts
├── components/
│   ├── ui/                       # Shadcn primitives (button, card, input, etc.)
│   ├── landing/                  # Hero, how-it-works, pricing cards
│   ├── onboarding/               # CvUpload, ProfileReview, QuestionsStep
│   ├── generate/                 # UrlInput, ProgressTracker, ResultPreview
│   ├── report/                   # Section viewers (CompanyIntel, RoleAnalysis, etc.)
│   └── dashboard/                # GenerationCard, CreditBadge, HistoryList
├── lib/
│   ├── db.ts                     # PostgreSQL pool + query helper
│   ├── ai/
│   │   ├── claude.ts             # callClaude(), callClaudeJSON() wrappers
│   │   └── prompts.ts            # All prompt template functions
│   ├── scraper.ts                # scrapeUrl() via Jina Reader + fallback
│   ├── research.ts               # researchCompany() via Perplexity
│   ├── pipeline.ts               # runPipeline() -- orchestrates all steps
│   ├── pdf/
│   │   ├── renderer.ts           # renderPdf() -- Puppeteer HTML→PDF
│   │   └── template.ts           # buildHtml() -- injects data into template
│   ├── storage.ts                # uploadPdf(), getPdfUrl()
│   ├── stripe.ts                 # createCheckoutSession(), verifyWebhook()
│   ├── credits.ts                # hasCredits(), deductCredit(), addCredits()
│   └── utils.ts                  # cn(), formatDate(), etc.
├── hooks/
│   ├── use-onboarding.ts
│   ├── use-generate.ts
│   ├── use-report.ts
│   └── use-credits.ts
├── types/
│   ├── report.ts                 # IntelligenceReportData, all section types
│   ├── generation.ts             # Generation, GenerationStatus
│   ├── onboarding.ts             # CvExtracted, OnboardingQuestion
│   └── index.ts
├── migrations/
│   └── 001_initial.sql
├── public/
│   └── pdf-template/             # CSS, fonts, images for PDF
├── auth.ts
├── auth-edge.ts
├── middleware.ts
├── schema.sql
├── package.json
├── .env.local.example
└── README.md
```

---

## 3. Database Schema

```sql
-- ── Auth (NextAuth v5) ──────────────────────────────────────────────────────

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  image TEXT,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(255),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ── User Profiles ───────────────────────────────────────────────────────────

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  cv_raw_text TEXT,
  cv_extracted JSONB DEFAULT '{}',
  onboarding_qa JSONB DEFAULT '[]',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  credits_remaining INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Generations (each PDF request) ──────────────────────────────────────────

CREATE TABLE generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  progress_message TEXT,
  job_data JSONB DEFAULT '{}',
  company_data JSONB DEFAULT '{}',
  report_data JSONB DEFAULT '{}',
  pdf_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- status values: pending | scraping | analyzing | researching | generating | rendering | completed | failed

CREATE INDEX idx_generations_user ON generations(user_id);
CREATE INDEX idx_generations_status ON generations(user_id, status);

-- ── Payments ────────────────────────────────────────────────────────────────

CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  amount_cents INTEGER NOT NULL,
  credits_purchased INTEGER NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=random-secret-here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Research
PERPLEXITY_API_KEY=pplx-...

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_1_CREDIT=price_...
STRIPE_PRICE_5_CREDITS=price_...
STRIPE_PRICE_15_CREDITS=price_...

# Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

---

## 5. Pipeline Architecture

When a user submits a job URL, this is the exact sequence that runs server-side:

### Step 1: Scrape Job Posting
- Tool: Jina Reader (`https://r.jina.ai/{url}`)
- Fallback: direct fetch + strip HTML tags
- Output: clean markdown text of the job posting
- Status: `scraping` / progress: 10%

### Step 2: Extract Job Data
- Tool: Claude Haiku
- Input: scraped markdown
- Output: structured JSON (title, company, location, salary, must-have skills, nice-to-have skills, responsibilities, benefits, tech stack, seniority, team info, role summary)
- Status: `analyzing` / progress: 20%

### Step 3: Scrape Company Website
- Tool: Jina Reader on `{company_url}` (extracted from job data or inferred)
- Scrape: homepage + about page
- Output: company website content
- Status: `researching` / progress: 30%

### Step 4: Research Company
- Tool: Perplexity Sonar API (3 queries)
- Query 1: "{company} company overview culture work environment employee reviews"
- Query 2: "{company} recent news funding acquisitions 2025 2026"
- Query 3: "{job_title} salary range {location} 2026 market data"
- Output: 3 research result texts
- Status: `researching` / progress: 45%

### Step 5: Synthesize Company Intel
- Tool: Claude Haiku
- Input: company website content + 3 research results + job data
- Output: structured company profile JSON
- Status: `analyzing` / progress: 55%

### Step 6: Generate Full Report (Sections 1-7)
- Tool: Claude Sonnet (quality matters here)
- Input: user CV profile + job data + company data
- Output: all report sections as structured JSON
- Status: `generating` / progress: 75%

### Step 7: Generate STAR Stories + Interview Scripts
- Tool: Claude Sonnet
- Input: user profile + job data + company values
- Output: 8-10 STAR stories, scripted answers, talking points
- Status: `generating` / progress: 85%

### Step 8: Generate Quick Reference Card
- Tool: Claude Haiku (fast)
- Input: summary of full report
- Output: the "parking lot cheat sheet"
- Status: `generating` / progress: 90%

### Step 9: Render PDF
- Tool: Puppeteer
- Input: HTML template populated with all report data
- Output: PDF buffer
- Status: `rendering` / progress: 95%

### Step 10: Store and Complete
- Upload PDF to Vercel Blob
- Save pdf_url to generations table
- Status: `completed` / progress: 100%

### Implementation Pattern

```typescript
// lib/pipeline.ts
export async function runPipeline(generationId: string, userId: string, sourceUrl: string) {
  const updateProgress = async (status: string, progress: number, message: string) => {
    await query(
      `UPDATE generations SET status=$1, progress=$2, progress_message=$3 WHERE id=$4`,
      [status, progress, message, generationId]
    );
  };

  try {
    // Step 1
    await updateProgress('scraping', 10, 'Scraping job posting...');
    const scrapedJob = await scrapeUrl(sourceUrl);

    // Step 2
    await updateProgress('analyzing', 20, 'Extracting job details...');
    const jobData = await callClaudeJSON(JOB_EXTRACTION_PROMPT(scrapedJob, sourceUrl), { model: 'haiku' });
    await query(`UPDATE generations SET job_data=$1 WHERE id=$2`, [JSON.stringify(jobData), generationId]);

    // Step 3
    await updateProgress('researching', 30, 'Researching company...');
    const companyUrl = inferCompanyUrl(jobData);
    const companySite = companyUrl ? await scrapeUrl(companyUrl) : '';

    // Step 4
    await updateProgress('researching', 45, 'Gathering intelligence...');
    const research = await researchCompany(jobData.company, jobData.jobTitle, jobData.location);

    // Step 5
    await updateProgress('analyzing', 55, 'Analyzing company...');
    const companyData = await callClaudeJSON(
      COMPANY_RESEARCH_PROMPT(jobData.company, companySite, JSON.stringify(research)),
      { model: 'haiku' }
    );
    await query(`UPDATE generations SET company_data=$1 WHERE id=$2`, [JSON.stringify(companyData), generationId]);

    // Step 6
    const userProfile = await getUserProfile(userId);
    await updateProgress('generating', 75, 'Generating your report...');
    const reportSections = await callClaudeJSON(
      FULL_REPORT_PROMPT(JSON.stringify(userProfile), JSON.stringify(jobData), JSON.stringify(companyData)),
      { model: 'sonnet' }
    );

    // Step 7
    await updateProgress('generating', 85, 'Crafting your stories and scripts...');
    const storiesAndScripts = await callClaudeJSON(
      STORIES_AND_SCRIPTS_PROMPT(JSON.stringify(userProfile), JSON.stringify(jobData), JSON.stringify(companyData)),
      { model: 'sonnet' }
    );

    // Step 8
    await updateProgress('generating', 90, 'Building quick reference...');
    const quickRef = await callClaudeJSON(
      QUICK_REFERENCE_PROMPT(JSON.stringify({ ...reportSections, ...storiesAndScripts })),
      { model: 'haiku' }
    );

    const fullReport = { ...reportSections, ...storiesAndScripts, quickReference: quickRef };
    await query(`UPDATE generations SET report_data=$1 WHERE id=$2`, [JSON.stringify(fullReport), generationId]);

    // Step 9
    await updateProgress('rendering', 95, 'Rendering your PDF...');
    const pdfBuffer = await renderPdf(fullReport, jobData, companyData, userProfile);

    // Step 10
    const pdfUrl = await uploadPdf(pdfBuffer, `${generationId}.pdf`);
    await query(
      `UPDATE generations SET status='completed', progress=100, progress_message='Done!', pdf_url=$1, completed_at=CURRENT_TIMESTAMP WHERE id=$2`,
      [pdfUrl, generationId]
    );
  } catch (error) {
    await query(
      `UPDATE generations SET status='failed', error_message=$1 WHERE id=$2`,
      [error.message, generationId]
    );
  }
}
```

---

## 6. API Routes

### POST /api/generate/start
- Auth required
- Body: `{ url: string }`
- Logic: validate URL, check credits, deduct 1 credit, create generation record, kick off `runPipeline()` in background
- Response: `{ generationId: "uuid" }`

### GET /api/generate/status/[id]
- Auth required
- Logic: fetch generation by id, verify ownership
- Response: `{ status, progress, progressMessage, pdfUrl?, errorMessage? }`
- Frontend polls this every 2 seconds

### GET /api/report/[id]
- Auth required
- Logic: fetch generation, return report_data JSON
- Response: full report data for in-app viewer

### GET /api/report/[id]/pdf
- Auth required
- Logic: redirect to pdf_url (Vercel Blob signed URL) or stream the PDF
- Response: PDF file

### POST /api/onboarding/upload-cv
- Auth required
- Body: FormData with PDF file
- Logic: pdf-parse → Claude extraction → save to user_profiles
- Response: `{ extracted: CvExtracted }`

### POST /api/onboarding/questions
- Auth required
- Logic: read cv_extracted from profile → Claude generates 3-5 follow-up questions
- Response: `{ questions: OnboardingQuestion[] }`

### POST /api/onboarding/complete
- Auth required
- Body: `{ answers: [{questionId, question, answer}] }`
- Logic: save answers, set onboarding_completed = true
- Response: `{ success: true }`

### POST /api/payments/checkout
- Auth required
- Body: `{ priceId: string }`
- Logic: create Stripe Checkout Session, return URL
- Response: `{ checkoutUrl: string }`

### POST /api/payments/webhook
- No auth (Stripe calls this)
- Logic: verify Stripe signature, on checkout.session.completed: increment credits
- Response: 200

---

## 7. AI Prompts

### JOB_EXTRACTION_PROMPT

Input: scraped markdown of job posting + source URL

Output JSON:
```json
{
  "jobTitle": "string",
  "company": "string",
  "location": "string",
  "workMode": "Remote|Hybrid|Onsite",
  "salary": "string or estimated",
  "mustHaveSkills": ["string"],
  "niceToHaveSkills": ["string"],
  "responsibilities": ["string"],
  "benefits": ["string"],
  "teamInfo": "string",
  "techStack": ["string"],
  "seniorityLevel": "Junior|Mid|Senior|Lead|Principal",
  "companyDescription": "string",
  "companyUrl": "string (inferred or found)",
  "roleSummary": "string"
}
```

### CV_EXTRACTION_PROMPT

Input: raw CV text

Output JSON:
```json
{
  "summary": "2-sentence professional identity",
  "skills": ["all hard skills"],
  "experience": [
    { "company": "str", "title": "str", "duration": "str", "achievements": ["str"] }
  ],
  "education": [
    { "institution": "str", "degree": "str", "year": "str" }
  ],
  "certifications": ["str"],
  "experienceLevel": "Junior|Mid|Senior|Lead|Executive",
  "keyAchievements": ["top 3-5 quantified achievements"],
  "industries": ["industries worked in"]
}
```

### COMPANY_RESEARCH_PROMPT

Input: company name + website content + 3 Perplexity research results + job data

Output JSON:
```json
{
  "overview": "what the company does",
  "product": "what they build/sell",
  "businessModel": "how they make money",
  "culture": {
    "values": ["stated or inferred"],
    "workStyle": "description",
    "signals": [{ "signal": "str", "evidence": "str", "implication": "str" }]
  },
  "techStack": ["str"],
  "size": "str",
  "stage": "Startup|Growth|Enterprise|Public",
  "founded": "year",
  "headquarters": "location",
  "recentNews": ["str"],
  "leadership": [{ "name": "str", "title": "str" }],
  "employeeSentiment": "summarized Glassdoor/Blind themes",
  "competitors": ["str"],
  "whyTheyreHiring": "inferred pain point this role solves"
}
```

### FULL_REPORT_PROMPT

Input: user profile JSON + job data JSON + company data JSON

This is the big prompt. It generates all main report sections. System prompt should instruct:
- Every claim must cite data from the inputs (no hallucination)
- Cross-reference the candidate's profile with job requirements
- Be specific, never generic

Output JSON:
```json
{
  "companyIntelligence": {
    "overview": "3-4 sentence deep dive",
    "businessModel": "how they make money",
    "culture": "analysis with signals",
    "recentDevelopments": ["str"],
    "techEnvironment": "str",
    "sizeAndStage": "str",
    "keyPeople": [{ "name": "str", "title": "str", "relevance": "str" }],
    "employeeSentiment": "str",
    "whatTheyValueMost": "str"
  },
  "roleAnalysis": {
    "daytoDayReality": "decoded from JD",
    "skillMatrix": [
      { "skill": "str", "required": true, "importance": "Critical|High|Medium", "candidateHas": true, "notes": "str" }
    ],
    "seniorityExpectation": "str",
    "teamContext": "str",
    "growthPath": "str",
    "postingRedFlags": [{ "flag": "str", "evidence": "str" }]
  },
  "fitAnalysis": {
    "positioningStatement": "2 sentences",
    "experienceMapping": [
      { "yourExperience": "str", "theirRequirement": "str", "talkingPoint": "str" }
    ],
    "gaps": [
      { "gap": "str", "severity": "Critical|Moderate|Minor", "mitigation": "str" }
    ],
    "unfairAdvantage": "str"
  },
  "screeningPrep": {
    "tellMeAboutYourself": "scripted 90-second pitch",
    "whyThisCompany": "scripted answer",
    "whyThisRole": "scripted answer",
    "salaryAnswer": { "range": "str", "script": "str", "marketData": "str" },
    "hrTraps": [{ "question": "str", "script": "str" }],
    "questionsToAsk": [{ "question": "str", "why": "str" }]
  },
  "technicalPrep": {
    "skillDepthGuide": [
      { "skill": "str", "expectedDepth": "str", "yourProjects": "str", "prepTip": "str" }
    ],
    "systemDesignTopics": ["str"],
    "technicalStoryBank": [
      { "project": "str", "problem": "str", "approach": "str", "techUsed": "str", "result": "str" }
    ]
  },
  "salaryIntelligence": {
    "marketRange": { "low": "str", "mid": "str", "high": "str", "currency": "str" },
    "confidence": "High|Medium|Low",
    "companyPayReputation": "str",
    "yourLeverage": ["str"],
    "negotiationScript": "str",
    "counterOfferEmail": "str"
  },
  "redFlags": [
    { "flag": "str", "evidence": "str", "severityLevel": "High|Medium|Low", "questionToAsk": "str" }
  ]
}
```

### STORIES_AND_SCRIPTS_PROMPT

Input: user profile JSON + job data JSON + company data JSON

Output JSON:
```json
{
  "starStories": [
    {
      "title": "short name for this story",
      "theme": "Conflict|Leadership|Failure|Pressure|Collaboration|Innovation|Ambiguity|Achievement",
      "situation": "str",
      "task": "str",
      "action": "str",
      "result": "str (quantified)",
      "bestFor": ["which interview questions this answers"],
      "companyValueMatch": "which company value this demonstrates"
    }
  ],
  "behavioralPrep": {
    "companyValuesMapping": [
      { "value": "str", "yourStory": "reference to which STAR story", "angle": "str" }
    ],
    "cultureFitAngles": ["str"],
    "deliveryTips": "str"
  },
  "finalRoundPrep": {
    "strategicQuestions": [{ "question": "str", "whyItMatters": "str" }],
    "visionAlignment": "str",
    "reverseClose": "str"
  }
}
```

### QUICK_REFERENCE_PROMPT

Input: summary of full report data

Output JSON:
```json
{
  "threeThingsToMention": ["str", "str", "str"],
  "threeStoriesReady": [
    { "trigger": "if they ask about...", "story": "use your [story name]", "punchline": "str" }
  ],
  "threeQuestionsToAsk": ["str", "str", "str"],
  "oneThingToAvoid": "str",
  "elevatorPitch": "30-second version of why you're the right fit",
  "confidenceBooster": "1 sentence reminder of your strongest asset for this role"
}
```

---

## 8. PDF Template Structure

The PDF is generated by Puppeteer rendering an HTML page. The HTML template lives in `lib/pdf/template.ts` as a function that returns an HTML string populated with data.

### Design Specs:
- Page size: A4 (210mm x 297mm)
- Font: Inter (loaded from Google Fonts or embedded)
- Color palette: Navy (#1e293b) headers, white (#ffffff) body, Indigo (#6366f1) accents, green/amber/red for skill matrix
- CSS `@page` rules for margins and page breaks
- Each section starts on a new page (`page-break-before: always`)

### Page Layout:

**Page 1 -- Cover**
- Company logo: `https://logo.clearbit.com/{domain}` (free API)
- Job title (large)
- Company name
- "Prepared for: {candidate name}"
- Date generated
- "InterviewIQ Intelligence Report"

**Pages 2-3 -- Company Intelligence**
- Grid layout: overview card, business model card, culture card
- Recent news as timeline
- Key people as avatar cards
- Employee sentiment as a rating bar
- "Why They're Hiring" callout box

**Pages 4-5 -- Role Analysis**
- Day-to-day reality paragraph
- Skill matrix: table with columns [Skill | Required | Importance | You Have It | Notes] -- color-coded rows
- Team context box
- Growth path arrow diagram
- Red flags as warning cards

**Pages 6-7 -- Your Fit Analysis**
- Positioning statement in a highlight box
- Experience mapping: two-column layout (Your Experience → Their Requirement)
- Gaps table with severity badges and mitigation notes
- "Your Unfair Advantage" callout

**Pages 8-9 -- Screening Round**
- Each scripted answer in a formatted box with the question as header
- Salary answer with market data sidebar
- HR traps as Q&A cards
- Questions to ask as numbered list

**Pages 10-11 -- Technical Round**
- Skill depth guide as cards
- System design topics list
- Technical story bank as formatted STAR cards

**Pages 12-14 -- Behavioral Round**
- STAR stories as full-width cards (8-10 stories)
- Each card: title, theme badge, S/T/A/R sections, "Best For" tags
- Company values mapping table
- Culture fit tips sidebar

**Pages 15-16 -- Final Round + Salary/Negotiation**
- Strategic questions as cards
- Vision alignment paragraph
- Market salary range as a visual range bar
- Negotiation scripts in formatted text boxes
- Counter-offer email as a copyable block

**Pages 17-18 -- Red Flags + Quick Reference**
- Red flags as warning cards with severity badges
- Questions that reveal truth

**Last Page -- Quick Reference Card**
- Designed as a standalone "cheat sheet"
- 3 columns layout
- Large, scannable text
- "Print this page and bring it with you"

---

## 9. Pages and UI

### Landing Page (`/`)
- Hero section: headline, subheadline, CTA button
- "How it works" 3-step section with icons
- Sample PDF preview (show a blurred/sample PDF)
- Pricing section
- FAQ
- Footer

### Login/Signup (`/login`, `/signup`)
- Email + password form
- Google OAuth button
- Redirect to onboarding if new user

### Onboarding (`/onboarding`)
- Step indicator (1 → 2 → 3)
- Step 1: drag-drop CV upload, show parsing progress
- Step 2: display extracted profile in cards, let user review/correct
- Step 3: AI-generated follow-up questions form
- "Complete" redirects to dashboard

### Dashboard (`/dashboard`)
- Credit balance badge (prominent)
- "Generate New Report" button (large CTA)
- Generation history: list of cards with company name, job title, date, status badge, download button
- Empty state: "Paste your first job URL to get started"

### Generate (`/generate`)
- Large URL input field, centered
- "Generate Report" button
- After submission: progress tracker showing pipeline steps with animated progress bar
- Each step shows status (checkmark when done, spinner when active)
- On completion: report preview + download button

### Report Viewer (`/report/[id]`)
- In-app version of the PDF content
- Collapsible sections
- "Download PDF" sticky button
- Share button (optional, future)

### Pricing (`/pricing`)
- 3 credit packs displayed as cards
- Stripe checkout flow

---

## 10. Payment Flow

1. User signs up → gets 2 free credits
2. User generates reports → credits decrease
3. At 0 credits, "Generate" shows "Buy Credits" instead
4. User clicks "Buy Credits" → selects pack:
   - 1 PDF: $2.00
   - 5 PDFs: $8.00 ($1.60 each)
   - 15 PDFs: $20.00 ($1.33 each)
5. POST /api/payments/checkout → creates Stripe Checkout Session → redirect
6. Stripe Checkout → user pays → redirect back to dashboard
7. Stripe webhook fires → POST /api/payments/webhook → verify → add credits

### Credit Logic (`lib/credits.ts`)

```typescript
export async function hasCredits(userId: string): Promise<boolean> {
  const result = await query('SELECT credits_remaining FROM user_profiles WHERE user_id = $1', [userId]);
  return (result.rows[0]?.credits_remaining ?? 0) > 0;
}

export async function deductCredit(userId: string): Promise<void> {
  await query(
    'UPDATE user_profiles SET credits_remaining = credits_remaining - 1 WHERE user_id = $1 AND credits_remaining > 0',
    [userId]
  );
}

export async function addCredits(userId: string, count: number): Promise<void> {
  await query(
    'UPDATE user_profiles SET credits_remaining = credits_remaining + $1 WHERE user_id = $2',
    [count, userId]
  );
}
```

---

## 11. Build Phases (Agile)

### Sprint 1: Core Pipeline (URL → Text Output)
**Goal: Paste a URL, see structured report text on screen. No auth, no PDF, no payments.**

- `npx create-next-app@latest` with TypeScript + Tailwind + App Router
- Install: `@anthropic-ai/sdk`, `pg`, `pdf-parse`
- Set up `lib/db.ts`, `lib/ai/claude.ts`, `lib/scraper.ts`, `lib/research.ts`
- Write all prompts in `lib/ai/prompts.ts`
- Build `lib/pipeline.ts` (all 8 AI steps, skip PDF rendering)
- Create a simple `/generate` page: URL input → calls API → polls status → shows report text
- API routes: `/api/generate/start`, `/api/generate/status/[id]`
- Database: `generations` table only (for now)
- **Test: paste a real job URL, see full report output on screen**

### Sprint 2: Onboarding (CV Upload)
- Add `user_profiles` table
- Build CV upload: `/api/onboarding/upload-cv`
- Build questions: `/api/onboarding/questions`
- Build complete: `/api/onboarding/complete`
- Onboarding UI page
- Wire user profile into pipeline (so report is personalized)
- **Test: upload CV, answer questions, generate personalized report**

### Sprint 3: PDF Output
- Install Puppeteer (`puppeteer`, `@sparticuz/chromium`)
- Build HTML/CSS template (`lib/pdf/template.ts`)
- Build renderer (`lib/pdf/renderer.ts`)
- Set up Vercel Blob storage
- Add PDF step to pipeline
- API route: `/api/report/[id]/pdf`
- Download button on generate page
- **Test: generate report, download beautiful PDF**

### Sprint 4: Auth + Dashboard
- Install `next-auth`
- Set up credentials + Google OAuth
- Middleware: protect app routes
- Onboarding redirect for new users
- Dashboard page: history of generations, credit balance
- In-app report viewer (`/report/[id]`)
- **Test: sign up, onboard, generate, see history**

### Sprint 5: Payments
- Stripe setup: products, prices, webhook
- `/api/payments/checkout` and `/api/payments/webhook`
- Credit system: 2 free, then pay
- Pricing page
- "Buy Credits" flow
- **Test: use 2 free credits, buy more, generate**

### Sprint 6: Landing Page + Polish
- Marketing landing page
- Error handling throughout
- Loading states, toast notifications
- Mobile responsive
- SEO meta tags
- Rate limiting
- **Test: full user journey from landing to PDF download**

---

## 12. Cost Per PDF

| Step | Tool | Cost |
|------|------|------|
| Scrape job page | Jina Reader | ~$0.001 |
| Scrape company site | Jina Reader | ~$0.001 |
| Research x3 queries | Perplexity Sonar | ~$0.003 |
| Job extraction | Claude Haiku (4K in / 1.5K out) | ~$0.012 |
| CV extraction | Claude Haiku (cached after first use) | ~$0.000 |
| Company synthesis | Claude Haiku (6K in / 2K out) | ~$0.016 |
| Full report | Claude Sonnet (8K in / 6K out) | ~$0.114 |
| Stories + scripts | Claude Sonnet (5K in / 4K out) | ~$0.075 |
| Quick-ref card | Claude Haiku (4K in / 1K out) | ~$0.009 |
| PDF rendering | Puppeteer (local) | $0.000 |
| PDF storage | Vercel Blob | ~$0.001 |
| **Total** | | **~$0.23** |

**Sell at $2.00 → 88% margin**

---

## 13. Dependencies

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@anthropic-ai/sdk": "latest",
    "@tanstack/react-query": "^5",
    "next-auth": "^5.0.0-beta.30",
    "pg": "^8",
    "pdf-parse": "^1.1.1",
    "puppeteer": "^23",
    "@sparticuz/chromium": "^131",
    "@vercel/blob": "latest",
    "stripe": "^17",
    "bcryptjs": "^3",
    "zod": "^4",
    "sonner": "^2",
    "lucide-react": "latest",
    "clsx": "^2",
    "tailwind-merge": "^3",
    "class-variance-authority": "^0.7"
  },
  "devDependencies": {
    "typescript": "^5",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^22",
    "@types/pg": "^8",
    "@types/bcryptjs": "^2",
    "eslint": "^9",
    "eslint-config-next": "^15",
    "shadcn": "latest"
  }
}
```
