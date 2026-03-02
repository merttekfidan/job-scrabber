# Data Model — HuntIQ Interview Intelligence Engine

> All schema changes required for the new features.
> Each table includes migration SQL, TypeScript types, and relationship mapping.

---

## Schema Overview

### Existing Tables (unchanged)
```
applications          — Job applications (core entity)
cv_data               — Uploaded CVs with AI analysis
users                 — Auth users
accounts              — OAuth accounts
sessions              — Auth sessions
verification_tokens   — Email verification
user_profiles         — Settings, AI keys
feedbacks             — User feedback
```

### New Tables

| Table | Feature | Phase |
|-------|---------|-------|
| `interview_vault` | Answer Vault | Phase 4 |
| `study_packages` | Smart Study Notes | Phase 5 |
| `interview_debriefs` | Debrief & Learning Loop | Phase 6 |
| `briefing_cache` | Quick Reference Cards | Phase 7 |
| `mock_sessions` | Mock Interview | Phase 8 |
| `offer_details` | Salary & Negotiation | Phase 9 |

---

## Entity Relationship Diagram

```
users (1)
  ├──< applications (N)
  │       ├──< study_packages (N) ── one per interview round
  │       ├──< interview_debriefs (N) ── one per interview round
  │       ├──< briefing_cache (N) ── one per round, regeneratable
  │       ├──< mock_sessions (N)
  │       └──< offer_details (0-1) ── only when offer received
  │
  ├──< interview_vault (N) ── user's global answer library
  └──< cv_data (N)
```

---

## Table Definitions

### 1. interview_vault

```sql
-- Migration: migrations/004_interview_vault.sql

CREATE TABLE IF NOT EXISTS interview_vault (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Question
    question TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Behavioral',
    -- Categories: 'Behavioral', 'Situational', 'Technical', 'Role-Specific'

    -- Answer (STAR structured)
    answer_situation TEXT,
    answer_task TEXT,
    answer_action TEXT,
    answer_result TEXT,
    answer_bridge TEXT,
    full_answer TEXT NOT NULL,

    -- AI-generated metadata
    key_phrases JSONB DEFAULT '[]',
    strength_signals JSONB DEFAULT '[]',
    adaptation_notes TEXT,

    -- User tracking
    status VARCHAR(30) DEFAULT 'Draft',
    -- Statuses: 'Draft', 'Ready', 'Used', 'Worked Well', 'Needs Improvement'
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    last_used_for INTEGER REFERENCES applications(id) ON DELETE SET NULL,

    -- Metadata
    word_count INTEGER,
    ai_generated BOOLEAN DEFAULT FALSE,
    source_cv_id INTEGER REFERENCES cv_data(id) ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vault_user ON interview_vault(user_id);
CREATE INDEX idx_vault_category ON interview_vault(user_id, category);
CREATE INDEX idx_vault_status ON interview_vault(user_id, status);
CREATE INDEX idx_vault_search ON interview_vault
    USING GIN (to_tsvector('english', question || ' ' || COALESCE(full_answer, '')));
```

**TypeScript Types:**

```typescript
// types/vault.ts

export type VaultCategory = 'Behavioral' | 'Situational' | 'Technical' | 'Role-Specific';

export type VaultStatus = 'Draft' | 'Ready' | 'Used' | 'Worked Well' | 'Needs Improvement';

export type VaultAnswer = {
  id: number;
  user_id: string;
  question: string;
  category: VaultCategory;
  answer_situation: string | null;
  answer_task: string | null;
  answer_action: string | null;
  answer_result: string | null;
  answer_bridge: string | null;
  full_answer: string;
  key_phrases: string[];
  strength_signals: string[];
  adaptation_notes: string | null;
  status: VaultStatus;
  times_used: number;
  last_used_at: string | null;
  last_used_for: number | null;
  word_count: number | null;
  ai_generated: boolean;
  source_cv_id: number | null;
  created_at: string;
  updated_at: string;
};

export type CreateVaultAnswerInput = {
  question: string;
  category: VaultCategory;
  answerSituation?: string;
  answerTask?: string;
  answerAction?: string;
  answerResult?: string;
  answerBridge?: string;
  fullAnswer: string;
  keyPhrases?: string[];
  strengthSignals?: string[];
  adaptationNotes?: string;
  status?: VaultStatus;
  aiGenerated?: boolean;
};

export type UpdateVaultAnswerInput = Partial<CreateVaultAnswerInput> & { id: number };

export type VaultFilters = {
  category?: VaultCategory;
  status?: VaultStatus;
  search?: string;
};
```

---

### 2. study_packages

```sql
-- Migration: migrations/005_study_packages.sql

CREATE TABLE IF NOT EXISTS study_packages (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

    -- Round reference
    round_index INTEGER NOT NULL,
    round_type VARCHAR(50) NOT NULL,
    -- Types: 'Screening', 'Technical', 'Behavioral', 'Final'

    -- AI-generated study content
    focus_summary TEXT,
    time_allocation JSONB DEFAULT '{}',
    -- { "offerSpecific": 20, "skillBased": 40, "behavioral": 25, "situational": 10, "companyResearch": 5 }

    questions JSONB DEFAULT '[]',
    -- Array of StudyQuestion objects

    must_know_facts JSONB DEFAULT '[]',
    -- Array of { fact, category, importance }

    quick_wins JSONB DEFAULT '[]',
    -- Array of strings

    danger_zones JSONB DEFAULT '[]',
    -- Array of { topic, mitigation }

    -- User progress
    user_notes JSONB DEFAULT '{}',
    -- { [questionId]: "user's personal notes" }

    questions_prepared JSONB DEFAULT '[]',
    -- Array of question IDs the user has marked as prepared

    -- Metadata
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    regenerated_count INTEGER DEFAULT 0,
    debrief_influenced BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(application_id, round_index)
);

CREATE INDEX idx_study_user ON study_packages(user_id);
CREATE INDEX idx_study_app ON study_packages(application_id);
```

**TypeScript Types:**

```typescript
// types/study.ts

export type StudyQuestion = {
  id: string;
  category: 'Offer-Specific' | 'Skill-Based' | 'HR-Behavioral' | 'Situational';
  question: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  whyThisWillBeAsked: string;
  coachingHint: string;
  sampleAnswerOutline: string;
  sourceRequirement: string;
};

export type StudyMustKnow = {
  fact: string;
  category: 'Company' | 'Role' | 'Technical' | 'Industry';
  importance: 'Critical' | 'Important' | 'Useful';
};

export type StudyDangerZone = {
  topic: string;
  mitigation: string;
};

export type StudyTimeAllocation = {
  offerSpecific: number;
  skillBased: number;
  behavioral: number;
  situational: number;
  companyResearch: number;
};

export type StudyPackage = {
  id: number;
  user_id: string;
  application_id: number;
  round_index: number;
  round_type: string;
  focus_summary: string | null;
  time_allocation: StudyTimeAllocation;
  questions: StudyQuestion[];
  must_know_facts: StudyMustKnow[];
  quick_wins: string[];
  danger_zones: StudyDangerZone[];
  user_notes: Record<string, string>;
  questions_prepared: string[];
  generated_at: string;
  regenerated_count: number;
  debrief_influenced: boolean;
  created_at: string;
  updated_at: string;
};
```

---

### 3. interview_debriefs

```sql
-- Migration: migrations/006_interview_debriefs.sql

CREATE TABLE IF NOT EXISTS interview_debriefs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

    -- Round reference
    round_index INTEGER NOT NULL,
    round_type VARCHAR(50) NOT NULL,
    interview_date DATE,

    -- User-reported data
    overall_feeling INTEGER CHECK (overall_feeling BETWEEN 1 AND 5),
    interviewer_vibe VARCHAR(30),
    -- 'Friendly', 'Neutral', 'Challenging', 'Hostile'
    general_notes TEXT,

    -- Questions and self-evaluation
    questions JSONB DEFAULT '[]',
    -- Array of DebriefQuestion objects:
    -- { question, category, myAnswer, confidence (1-5), wishISaid }

    -- AI analysis (populated after AI analyze call)
    ai_analysis JSONB DEFAULT '{}',
    -- DebriefAnalysis object

    -- Outcome tracking
    outcome VARCHAR(30),
    -- 'Passed', 'Rejected', 'Ghosted', 'Pending', null

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(application_id, round_index)
);

CREATE INDEX idx_debrief_user ON interview_debriefs(user_id);
CREATE INDEX idx_debrief_app ON interview_debriefs(application_id);
CREATE INDEX idx_debrief_date ON interview_debriefs(user_id, interview_date DESC);
```

**TypeScript Types:**

```typescript
// types/debrief.ts

export type DebriefQuestion = {
  id: string;
  question: string;
  category: 'Technical' | 'Behavioral' | 'Situational' | 'Role-Specific';
  myAnswer: string;
  confidence: 1 | 2 | 3 | 4 | 5;
  wishISaid: string;
};

export type InterviewerVibe = 'Friendly' | 'Neutral' | 'Challenging' | 'Hostile';

export type DebriefOutcome = 'Passed' | 'Rejected' | 'Ghosted' | 'Pending';

export type DebriefAnalysis = {
  overallAssessment: string;
  confidenceMap: {
    strong: string[];
    developing: string[];
    weak: string[];
  };
  gapAnalysis: Array<{
    question: string;
    rootCause: string;
    improvement: string;
  }>;
  patterns: Array<{
    pattern: string;
    frequency: string;
    recommendation: string;
  }>;
  nextInterviewFocus: string[];
  vaultSuggestions: Array<{
    question: string;
    reason: string;
  }>;
};

export type DebriefTrendReport = {
  totalInterviews: number;
  dateRange: string;
  overallTrajectory: 'Improving' | 'Stable' | 'Declining';
  categoryPerformance: Record<string, {
    avgConfidence: number;
    trend: '↑' | '→' | '↓';
    passRate: string;
  }>;
  topStrength: { area: string; evidence: string };
  topWeakness: { area: string; evidence: string; actionPlan: string };
  hiddenPatterns: Array<{ pattern: string; evidence: string; recommendation: string }>;
  strategicRecommendation: string;
};

export type InterviewDebrief = {
  id: number;
  user_id: string;
  application_id: number;
  round_index: number;
  round_type: string;
  interview_date: string | null;
  overall_feeling: number | null;
  interviewer_vibe: InterviewerVibe | null;
  general_notes: string | null;
  questions: DebriefQuestion[];
  ai_analysis: DebriefAnalysis | null;
  outcome: DebriefOutcome | null;
  created_at: string;
  updated_at: string;
};

export type CreateDebriefInput = {
  applicationId: number;
  roundIndex: number;
  roundType: string;
  interviewDate?: string;
  overallFeeling: number;
  interviewerVibe?: InterviewerVibe;
  generalNotes?: string;
  questions: Omit<DebriefQuestion, 'id'>[];
};
```

---

### 4. briefing_cache

```sql
-- Migration: migrations/006b_briefing_cache.sql
-- (Can be part of Phase 7, or created with Phase 6 migration)

CREATE TABLE IF NOT EXISTS briefing_cache (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

    round_index INTEGER NOT NULL,
    round_type VARCHAR(50) NOT NULL,

    -- AI-generated briefing content
    briefing_data JSONB NOT NULL DEFAULT '{}',
    -- Full BriefingCard JSON output from BRIEFING_GENERATE_PROMPT

    -- Cache management
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    invalidated BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(application_id, round_index)
);

CREATE INDEX idx_briefing_app ON briefing_cache(application_id);
CREATE INDEX idx_briefing_user_active ON briefing_cache(user_id, invalidated) WHERE NOT invalidated;
```

---

### 5. mock_sessions

```sql
-- Migration: migrations/007_mock_sessions.sql

CREATE TABLE IF NOT EXISTS mock_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

    -- Session config
    round_type VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'Medium',
    -- 'Easy', 'Medium', 'Hard'

    -- Session data
    interview_plan JSONB NOT NULL DEFAULT '{}',
    -- The AI-generated interview plan (questions + ideal signals)

    questions_and_answers JSONB DEFAULT '[]',
    -- Array of { question, userAnswer, evaluation }

    -- Results
    overall_score INTEGER,
    grade VARCHAR(5),
    hiring_decision VARCHAR(30),
    category_scores JSONB DEFAULT '{}',
    -- { technical, behavioral, communication, roleKnowledge }

    debrief JSONB DEFAULT '{}',
    -- Full post-mock debrief data

    -- Metadata
    status VARCHAR(20) DEFAULT 'in_progress',
    -- 'in_progress', 'completed', 'abandoned'
    questions_answered INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    duration_seconds INTEGER,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mock_user ON mock_sessions(user_id);
CREATE INDEX idx_mock_app ON mock_sessions(application_id);
CREATE INDEX idx_mock_scores ON mock_sessions(user_id, overall_score) WHERE status = 'completed';
```

**TypeScript Types:**

```typescript
// types/mock.ts

export type MockDifficulty = 'Easy' | 'Medium' | 'Hard';

export type MockQuestionPlan = {
  id: number;
  question: string;
  type: 'Technical' | 'Behavioral' | 'Situational' | 'Role-Specific';
  evaluates: string;
  followUp: string;
  idealAnswerSignals: string[];
};

export type MockAnswerEvaluation = {
  scores: {
    relevance: number;
    specificity: number;
    structure: number;
    impact: number;
    overall: number;
  };
  signalsCovered: string[];
  signalsMissed: string[];
  strengthMoment: string;
  improvementArea: string;
};

export type MockQA = {
  question: MockQuestionPlan;
  userAnswer: string;
  evaluation: MockAnswerEvaluation;
};

export type MockSessionDebrief = {
  overallScore: number;
  grade: string;
  hiringDecision: string;
  summary: string;
  categoryScores: Record<string, number>;
  topStrengths: Array<{ strength: string; evidence: string }>;
  topImprovements: Array<{ area: string; howToFix: string; practiceExercise: string }>;
  answerByAnswerFeedback: Array<{
    questionNumber: number;
    score: number;
    verdict: string;
    feedback: string;
    rewriteSuggestion: string;
  }>;
  nextSessionFocus: string;
};

export type MockSession = {
  id: number;
  user_id: string;
  application_id: number;
  round_type: string;
  difficulty: MockDifficulty;
  interview_plan: { questions: MockQuestionPlan[]; openingStatement: string };
  questions_and_answers: MockQA[];
  overall_score: number | null;
  grade: string | null;
  hiring_decision: string | null;
  category_scores: Record<string, number>;
  debrief: MockSessionDebrief | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  questions_answered: number;
  total_questions: number;
  duration_seconds: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
};
```

---

### 6. offer_details

```sql
-- Migration: migrations/008_offer_details.sql

CREATE TABLE IF NOT EXISTS offer_details (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

    -- Offer data
    base_salary VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'USD',
    bonus VARCHAR(100),
    equity VARCHAR(255),
    benefits JSONB DEFAULT '[]',
    other_perks TEXT,
    start_date DATE,
    offer_deadline DATE,

    -- AI analysis
    ai_analysis JSONB DEFAULT '{}',
    -- Full negotiation analysis output

    -- User decisions
    user_priority VARCHAR(50),
    -- 'Compensation', 'Growth', 'Work-Life Balance', 'Remote', 'Balanced'
    decision VARCHAR(30),
    -- 'Pending', 'Accepted', 'Declined', 'Negotiating'
    counter_offer_sent BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(application_id)
);

CREATE INDEX idx_offer_user ON offer_details(user_id);
CREATE INDEX idx_offer_active ON offer_details(user_id, decision) WHERE decision IN ('Pending', 'Negotiating');
```

**TypeScript Types:**

```typescript
// types/negotiation.ts

export type OfferDecision = 'Pending' | 'Accepted' | 'Declined' | 'Negotiating';

export type UserPriority = 'Compensation' | 'Growth' | 'Work-Life Balance' | 'Remote' | 'Balanced';

export type OfferDetails = {
  id: number;
  user_id: string;
  application_id: number;
  base_salary: string | null;
  currency: string;
  bonus: string | null;
  equity: string | null;
  benefits: string[];
  other_perks: string | null;
  start_date: string | null;
  offer_deadline: string | null;
  ai_analysis: NegotiationAnalysis | null;
  user_priority: UserPriority | null;
  decision: OfferDecision;
  counter_offer_sent: boolean;
  created_at: string;
  updated_at: string;
};

export type NegotiationAnalysis = {
  offerAnalysis: {
    marketPosition: string;
    estimatedMarketRange: { low: string; mid: string; high: string; currency: string };
    confidence: string;
    totalCompValue: string;
  };
  leverageAnalysis: {
    strongPoints: string[];
    weakPoints: string[];
    urgencyLevel: string;
  };
  negotiationStrategy: {
    approach: string;
    targetOffer: string;
    walkAwayPoint: string;
    negotiationScript: {
      opener: string;
      counterOffer: string;
      justification: string;
      ifTheyPushBack: string;
      closingMove: string;
    };
    emailTemplate: string;
    nonMonetaryAsks: Array<{ item: string; script: string }>;
  };
};

export type CreateOfferInput = {
  applicationId: number;
  baseSalary?: string;
  currency?: string;
  bonus?: string;
  equity?: string;
  benefits?: string[];
  otherPerks?: string;
  startDate?: string;
  offerDeadline?: string;
  userPriority?: UserPriority;
};
```

---

## Migration Order

Run migrations in this order (matches phase implementation):

```
1. migrations/004_interview_vault.sql      — Phase 4
2. migrations/005_study_packages.sql       — Phase 5
3. migrations/006_interview_debriefs.sql   — Phase 6
4. migrations/006b_briefing_cache.sql      — Phase 7
5. migrations/007_mock_sessions.sql        — Phase 8
6. migrations/008_offer_details.sql        — Phase 9
```

Each migration is independent and can be run incrementally (IF NOT EXISTS pattern).

---

## Index Strategy

All tables follow these indexing principles:
- **user_id index** on every table (multi-tenant query performance)
- **application_id index** for foreign key lookups
- **Composite indexes** for common query patterns (user + category, user + date)
- **Partial indexes** for active-only queries (WHERE status = 'completed')
- **GIN indexes** for full-text search on text-heavy columns (vault search)

---

## Data Retention

| Table | Retention | Reason |
|-------|-----------|--------|
| interview_vault | Permanent | Core user data, builds over time |
| study_packages | Permanent | Historical reference |
| interview_debriefs | Permanent | Trend analysis needs historical data |
| briefing_cache | 30 days after interview | Regeneratable, space optimization |
| mock_sessions | Permanent | Score tracking over time |
| offer_details | Permanent | Negotiation history |
