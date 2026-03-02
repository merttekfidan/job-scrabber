# Implementation Plan — HuntIQ Interview Intelligence Engine

> Phased implementation roadmap. Each phase is self-contained and testable.
> Follows the existing project convention: implement → test → proceed.

---

## Overview

### Total Phases: 7 (grouped into 3 waves)

```
WAVE 1 — Core Interview Intelligence (P0)
  Phase 4: Interview Answer Vault
  Phase 5: Smart Study Notes

WAVE 2 — Feedback Loop & Unified Prep (P1)
  Phase 6: Interview Debrief & Learning Loop
  Phase 7: Quick Reference Cards Redesign

WAVE 3 — Advanced Features (P2-P3)
  Phase 8: Mock Interview Simulator
  Phase 9: Salary & Offer Negotiation Toolkit
  Phase 10: Skill Gap Analyzer
```

> Note: Phases 0-3 are existing. This plan starts at Phase 4.

---

## Dependencies & Prerequisites

Before starting Wave 1:
- [ ] Phase 3 (component decomposition) should be complete or near-complete
- [ ] React Query hooks are integrated into dashboard (not raw fetch)
- [ ] AI provider system (Groq) is stable and tested
- [ ] CV upload and analysis pipeline is working

---

## WAVE 1 — Core Interview Intelligence

### Phase 4: Interview Answer Vault

**Duration:** ~5-7 days
**Dependencies:** CV upload (existing), AI prompts system (existing)

#### Step 4.1 — Data Layer
- [ ] Create `interview_vault` table (see `docs/DATA_MODEL.md`)
- [ ] Create migration: `migrations/004_interview_vault.sql`
- [ ] Add TypeScript types: `types/vault.ts`

```
New types:
- VaultAnswer
- VaultCategory
- VaultTag
- CreateVaultAnswerInput
- UpdateVaultAnswerInput
```

#### Step 4.2 — API Routes
- [ ] `POST /api/vault` — Create answer
- [ ] `GET /api/vault` — List answers (with category filter, search)
- [ ] `PUT /api/vault/[id]` — Update answer
- [ ] `DELETE /api/vault/[id]` — Delete answer
- [ ] `POST /api/ai/vault/generate` — AI generate answer from CV + question
- [ ] `POST /api/ai/vault/refine` — AI improve existing answer
- [ ] `POST /api/ai/vault/adapt` — AI adapt answer for specific job

#### Step 4.3 — React Query Hooks
- [ ] `useVaultAnswers(filters)` — List/search vault
- [ ] `useCreateVaultAnswer()` — Mutation
- [ ] `useUpdateVaultAnswer()` — Mutation
- [ ] `useDeleteVaultAnswer()` — Mutation
- [ ] `useGenerateVaultAnswer()` — AI mutation
- [ ] `useRefineVaultAnswer()` — AI mutation
- [ ] `useAdaptVaultAnswer(applicationId)` — AI mutation

#### Step 4.4 — UI Components
- [ ] `components/vault/VaultPage.tsx` — Main vault view
- [ ] `components/vault/VaultAnswerCard.tsx` — Single answer display
- [ ] `components/vault/VaultAnswerForm.tsx` — Create/edit form (STAR structured)
- [ ] `components/vault/VaultCategoryFilter.tsx` — Category tabs
- [ ] `components/vault/VaultSearchBar.tsx` — Search
- [ ] `components/vault/VaultAdaptModal.tsx` — Adapt answer to job modal

#### Step 4.5 — Integration
- [ ] Add Vault tab to application detail view (shows relevant answers for this job's skills)
- [ ] Add `/vault` route as standalone page
- [ ] Add vault navigation item to dashboard header

#### Step 4.6 — AI Prompts
- [ ] Add `VAULT_GENERATE_ANSWER_PROMPT` to `lib/ai/prompts.ts`
- [ ] Add `VAULT_REFINE_ANSWER_PROMPT` to `lib/ai/prompts.ts`
- [ ] Add `VAULT_ADAPT_ANSWER_PROMPT` to `lib/ai/prompts.ts`

#### How to Test (Phase 4)
1. Run `npm run dev` → navigate to `/vault`
2. Create a new answer manually (STAR form) → verify save/load
3. Use "AI Generate" with a question + CV → verify STAR output quality
4. Submit your own answer → use "AI Improve" → verify improvements are specific
5. Go to an application detail → use "Adapt for this role" → verify adaptation references JD
6. Test category filter, search, tags (Used, Worked Well, etc.)
7. Verify vault answers appear in application prep view

---

### Phase 5: Smart Study Notes

**Duration:** ~5-7 days
**Dependencies:** Phase 4 (vault integration), interview_stages (existing)

#### Step 5.1 — Data Layer
- [ ] Create `study_packages` table (see `docs/DATA_MODEL.md`)
- [ ] Create migration: `migrations/005_study_packages.sql`
- [ ] Add TypeScript types: `types/study.ts`

```
New types:
- StudyPackage
- StudyQuestion
- StudyMustKnow
- StudyQuickWin
- StudyDangerZone
```

#### Step 5.2 — API Routes
- [ ] `POST /api/ai/study/generate` — Generate study package for a round
- [ ] `GET /api/study/[applicationId]/[roundIndex]` — Get study package
- [ ] `PUT /api/study/[id]/notes` — Update user notes on questions
- [ ] `POST /api/ai/study/enhance` — Enhance user notes with AI
- [ ] `PUT /api/study/[id]/progress` — Mark questions as prepared

#### Step 5.3 — React Query Hooks
- [ ] `useStudyPackage(applicationId, roundIndex)` — Get/cache package
- [ ] `useGenerateStudyPackage()` — AI mutation
- [ ] `useUpdateStudyNotes()` — Mutation
- [ ] `useEnhanceStudyNotes()` — AI mutation
- [ ] `useUpdateStudyProgress()` — Mutation

#### Step 5.4 — UI Components
- [ ] `components/study/StudyPackageView.tsx` — Main study view
- [ ] `components/study/StudyQuestionCard.tsx` — Single question with notes, hints, difficulty
- [ ] `components/study/StudyCategorySection.tsx` — Category grouping
- [ ] `components/study/StudyTimeAllocation.tsx` — Time allocation bars
- [ ] `components/study/StudyProgressBar.tsx` — Questions prepared progress
- [ ] `components/study/StudyMustKnowList.tsx` — Must-know facts
- [ ] `components/study/StudyQuickWins.tsx` — Quick wins section

#### Step 5.5 — Integration
- [ ] Auto-trigger study package generation when interview round is created
- [ ] Show study package within PrepPanel attached to each round
- [ ] Connect to debrief data (Phase 6) for adaptive questions (post-Phase 6)

#### Step 5.6 — AI Prompts
- [ ] Add `STUDY_GENERATE_PACKAGE_PROMPT` to `lib/ai/prompts.ts`
- [ ] Add `STUDY_ENHANCE_NOTES_PROMPT` to `lib/ai/prompts.ts`

#### How to Test (Phase 5)
1. Run `npm run dev` → open an application detail
2. Add a new interview round (Technical) → verify study package auto-generates
3. Check questions are categorized correctly (Offer-Specific, Skill-Based, etc.)
4. Verify difficulty ratings and source requirements are shown
5. Add personal notes to a question → verify save
6. Use "Enhance with AI" → verify AI adds context without replacing user notes
7. Mark questions as "prepared" → verify progress bar updates
8. Create a Screening round → verify different question focus vs Technical

---

## WAVE 2 — Feedback Loop & Unified Prep

### Phase 6: Interview Debrief & Learning Loop

**Duration:** ~5-7 days
**Dependencies:** Phase 5 (study notes for adaptive feedback)

#### Step 6.1 — Data Layer
- [ ] Create `interview_debriefs` table (see `docs/DATA_MODEL.md`)
- [ ] Create migration: `migrations/006_interview_debriefs.sql`
- [ ] Add TypeScript types: `types/debrief.ts`

```
New types:
- InterviewDebrief
- DebriefQuestion
- DebriefAnalysis
- DebriefTrendReport
- CreateDebriefInput
```

#### Step 6.2 — API Routes
- [ ] `POST /api/debrief` — Save debrief
- [ ] `GET /api/debrief/[applicationId]` — Get debriefs for application
- [ ] `GET /api/debrief/all` — Get all user debriefs
- [ ] `POST /api/ai/debrief/analyze` — AI analyze single debrief
- [ ] `GET /api/ai/debrief/trends` — AI trend analysis (3+ debriefs)

#### Step 6.3 — React Query Hooks
- [ ] `useDebriefs(applicationId)` — Get debriefs for app
- [ ] `useAllDebriefs()` — Get all user debriefs
- [ ] `useCreateDebrief()` — Mutation
- [ ] `useAnalyzeDebrief()` — AI mutation
- [ ] `useDebriefTrends()` — AI query

#### Step 6.4 — UI Components
- [ ] `components/debrief/DebriefForm.tsx` — Post-interview form
- [ ] `components/debrief/DebriefQuestionEntry.tsx` — Single question entry
- [ ] `components/debrief/DebriefAnalysisView.tsx` — AI analysis display
- [ ] `components/debrief/ConfidenceMap.tsx` — Visual confidence by category
- [ ] `components/debrief/TrendReport.tsx` — Cross-interview trends (3+ debriefs)
- [ ] `components/debrief/NextFocusCard.tsx` — Top recommendations

#### Step 6.5 — Integration
- [ ] Add "Write Debrief" button to interview round (post-date)
- [ ] Show debrief analysis in InterviewsTab
- [ ] Feed weak areas into study package generation (loop back to Phase 5)
- [ ] Generate vault suggestions from debrief gaps (loop back to Phase 4)

#### Step 6.6 — AI Prompts
- [ ] Add `DEBRIEF_ANALYZE_PROMPT` to `lib/ai/prompts.ts`
- [ ] Add `DEBRIEF_TREND_PROMPT` to `lib/ai/prompts.ts`

#### How to Test (Phase 6)
1. Run `npm run dev` → open an application with interview rounds
2. Click "Write Debrief" on a past round → fill out form → verify save
3. Add 2+ questions with confidence scores → save → use "Analyze with AI"
4. Verify confidence map renders correctly
5. Create 3+ debriefs across different applications → check trend analysis
6. Verify "Next Interview Focus" recommendations are specific and actionable
7. Verify vault suggestions link to actual question gaps
8. Create a new study package → verify it references debrief weak areas

---

### Phase 7: Quick Reference Cards Redesign

**Duration:** ~3-5 days
**Dependencies:** Phases 4-6 (vault, study, debrief data to integrate)

#### Step 7.1 — AI Prompts
- [ ] Add `BRIEFING_GENERATE_PROMPT` to `lib/ai/prompts.ts`

#### Step 7.2 — API Routes
- [ ] `POST /api/ai/briefing/generate` — Generate unified briefing

#### Step 7.3 — React Query Hooks
- [ ] `useGenerateBriefing(applicationId, roundType)` — AI mutation

#### Step 7.4 — UI Components (Redesign)
- [ ] `components/briefing/BriefingCard.tsx` — New unified card (replaces old QuickReferenceCard)
- [ ] `components/briefing/BriefingSection.tsx` — Collapsible section (Critical/Important/Useful)
- [ ] `components/briefing/BriefingStoryTrigger.tsx` — "If they ask X, use vault answer Y"
- [ ] `components/briefing/BriefingQuickWins.tsx` — Quick win badges
- [ ] `components/briefing/BriefingCopyButton.tsx` — Structured copy

#### Step 7.5 — Integration
- [ ] Replace `QuickReferenceCard` in PrepPanel with new `BriefingCard`
- [ ] Auto-generate when interview is < 24 hours away
- [ ] Pull data from: prep notes, vault answers, company insights, study notes, debrief insights

> **See detailed redesign plan:** `docs/QUICK_REFERENCE_REDESIGN.md`

#### How to Test (Phase 7)
1. Run `npm run dev` → open application detail → PrepTab
2. Verify new BriefingCard replaces old QuickReferenceCard
3. Check that card content changes based on round type (Screening vs Technical)
4. Verify vault answers appear as "If they ask X, use Y"
5. Verify priority hierarchy (Critical → Important → Useful)
6. Test copy button → verify structured output
7. Test on mobile viewport → verify responsive layout

---

## WAVE 3 — Advanced Features

### Phase 8: Mock Interview Simulator

**Duration:** ~7-10 days
**Dependencies:** Phases 4-6 (vault for reference, study for questions, debrief for results)

#### Step 8.1 — Data Layer
- [ ] Create `mock_sessions` table (see `docs/DATA_MODEL.md`)
- [ ] Create migration: `migrations/007_mock_sessions.sql`
- [ ] Add TypeScript types: `types/mock.ts`

#### Step 8.2 — API Routes
- [ ] `POST /api/ai/mock/start` — Start mock session
- [ ] `POST /api/ai/mock/evaluate` — Evaluate single answer (internal)
- [ ] `POST /api/ai/mock/debrief` — Generate post-mock debrief
- [ ] `GET /api/mock/[applicationId]` — Get mock history
- [ ] `POST /api/mock/save` — Save mock session results

#### Step 8.3 — React Query Hooks
- [ ] `useStartMockSession()` — AI mutation
- [ ] `useSubmitMockAnswer()` — AI mutation (evaluate + next question)
- [ ] `useMockDebrief()` — AI mutation
- [ ] `useMockHistory(applicationId)` — Query
- [ ] `useSaveMockSession()` — Mutation

#### Step 8.4 — UI Components
- [ ] `components/mock/MockSessionSetup.tsx` — Round type + difficulty selector
- [ ] `components/mock/MockSessionInterface.tsx` — Chat-style Q&A
- [ ] `components/mock/MockQuestionBubble.tsx` — Interviewer question display
- [ ] `components/mock/MockAnswerInput.tsx` — User answer with timer + word count
- [ ] `components/mock/MockScorecard.tsx` — Post-session results
- [ ] `components/mock/MockQuestionFeedback.tsx` — Per-question feedback
- [ ] `components/mock/MockProgressBar.tsx` — Session progress (Q 3/6)

#### Step 8.5 — Integration
- [ ] Access from application detail or standalone
- [ ] Mock results can be saved as debrief data (Phase 6 integration)
- [ ] Mock uses study package questions when available (Phase 5 integration)
- [ ] Mock performance tracked over time

#### How to Test (Phase 8)
1. Start mock for Technical round → verify 5-7 realistic questions
2. Answer each question → verify follow-ups adapt to your answers
3. Complete session → verify scorecard with per-question feedback
4. Check scores are rubric-based (Relevance, Specificity, Structure, Impact)
5. Save results → verify they appear in mock history
6. Try different difficulty levels → verify question complexity changes

---

### Phase 9: Salary & Offer Negotiation Toolkit

**Duration:** ~4-6 days
**Dependencies:** None (standalone, activates on status change)

#### Step 9.1 — Data Layer
- [ ] Create `offer_details` table (see `docs/DATA_MODEL.md`)
- [ ] Create migration: `migrations/008_offer_details.sql`
- [ ] Add TypeScript types: `types/negotiation.ts`

#### Step 9.2 — API Routes
- [ ] `POST /api/offer` — Save offer details
- [ ] `GET /api/offer/[applicationId]` — Get offer
- [ ] `POST /api/ai/negotiation/analyze` — Analyze offer + generate strategy
- [ ] `POST /api/ai/negotiation/compare` — Compare multiple offers

#### Step 9.3 — UI Components
- [ ] `components/negotiation/OfferInputForm.tsx` — Offer details form
- [ ] `components/negotiation/MarketBenchmark.tsx` — Market comparison visualization
- [ ] `components/negotiation/NegotiationScript.tsx` — Script display with copy
- [ ] `components/negotiation/OfferComparison.tsx` — Multi-offer matrix
- [ ] `components/negotiation/CounterOfferStrategy.tsx` — Strategy display

#### Step 9.4 — Integration
- [ ] Auto-surface when application status → "Offer Received"
- [ ] New tab in application detail: "Offer & Negotiation"

---

### Phase 10: Skill Gap Analyzer

**Duration:** ~4-6 days
**Dependencies:** CV upload (existing), applications (existing)

#### Step 10.1 — API Routes
- [ ] `GET /api/ai/skills/gap` — Aggregate + analyze skill gaps
- [ ] `GET /api/skills/summary` — Cached skill summary

#### Step 10.2 — UI Components
- [ ] `components/skills/SkillGapDashboard.tsx` — Main view
- [ ] `components/skills/SkillRadarChart.tsx` — Visual skill map
- [ ] `components/skills/SkillGapCard.tsx` — Single gap with learning path
- [ ] `components/skills/SkillMatchBadge.tsx` — Match quality indicator

#### Step 10.3 — Integration
- [ ] Add to Coach page as new section
- [ ] Show skill match indicator on application cards
- [ ] Auto-refresh when new applications are added

---

## Timeline Summary

```
Week 1-2:  Phase 4 — Interview Answer Vault (P0)
Week 2-3:  Phase 5 — Smart Study Notes (P0)
Week 3-4:  Phase 6 — Interview Debrief & Learning Loop (P1)
Week 4-5:  Phase 7 — Quick Reference Cards Redesign (P1)
Week 5-7:  Phase 8 — Mock Interview Simulator (P2)
Week 7-8:  Phase 9 — Salary & Offer Negotiation Toolkit (P3)
Week 8-9:  Phase 10 — Skill Gap Analyzer (P3)
```

**Total estimated development time: 8-9 weeks (one developer)**

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| AI prompt quality inconsistent | Test each prompt with 5+ real job descriptions before shipping |
| Token costs spike | Implement token budgets per feature, cache AI responses in DB |
| Feature scope creep | Each phase has strict acceptance criteria — ship MVP then iterate |
| Phase 3 (decomposition) incomplete | Vault and Study Notes can be built as new routes, not dependent on dashboard refactor |
| Groq API rate limits | Implement retry logic, queue system for heavy AI features (mock sessions) |
