# HuntIQ — AI Navigation Roadmap

> **Purpose:** This is the FIRST document AI should read in any session.
> It routes you to the exact document(s) needed for the current task.
> DO NOT read all docs — only read what the task requires.

---

## Quick Reference: Which Doc to Read?

```
"What am I building?"          → docs/FEATURE_SPECS.md
"What's the AI persona/role?"  → docs/AI_SYSTEM_ROLES.md
"What prompt do I write?"      → docs/AI_PROMPTS.md
"What tables do I create?"     → docs/DATA_MODEL.md
"What's the build order?"      → docs/IMPLEMENTATION_PLAN.md
"How does Quick Ref work?"     → docs/QUICK_REFERENCE_REDESIGN.md
```

---

## Phase → Document Routing

When working on a specific phase, read ONLY the listed documents and sections.

### Phase 4: Interview Answer Vault

| Task | Read | Section to Find |
|------|------|----------------|
| Schema / migration | `DATA_MODEL.md` | "1. interview_vault" |
| TypeScript types | `DATA_MODEL.md` | TypeScript Types under interview_vault |
| API routes & hooks | `IMPLEMENTATION_PLAN.md` | "Phase 4: Interview Answer Vault" → Steps 4.2, 4.3 |
| UI components | `FEATURE_SPECS.md` | "F1: Interview Answer Vault" |
| AI prompts | `AI_PROMPTS.md` | "1. Answer Vault Prompts" (1A, 1B, 1C) |
| AI role definition | `AI_SYSTEM_ROLES.md` | "1. VAULT_COACH" |
| Testing | `IMPLEMENTATION_PLAN.md` | "How to Test (Phase 4)" |

### Phase 5: Smart Study Notes

| Task | Read | Section to Find |
|------|------|----------------|
| Schema / migration | `DATA_MODEL.md` | "2. study_packages" |
| TypeScript types | `DATA_MODEL.md` | TypeScript Types under study_packages |
| API routes & hooks | `IMPLEMENTATION_PLAN.md` | "Phase 5" → Steps 5.2, 5.3 |
| UI components | `FEATURE_SPECS.md` | "F2: Smart Study Notes" |
| AI prompts | `AI_PROMPTS.md` | "2. Smart Study Notes Prompts" (2A, 2B) |
| AI role definition | `AI_SYSTEM_ROLES.md` | "2. STUDY_ARCHITECT" |
| Testing | `IMPLEMENTATION_PLAN.md` | "How to Test (Phase 5)" |

### Phase 6: Interview Debrief & Learning Loop

| Task | Read | Section to Find |
|------|------|----------------|
| Schema / migration | `DATA_MODEL.md` | "3. interview_debriefs" |
| TypeScript types | `DATA_MODEL.md` | TypeScript Types under interview_debriefs |
| API routes & hooks | `IMPLEMENTATION_PLAN.md` | "Phase 6" → Steps 6.2, 6.3 |
| UI components | `FEATURE_SPECS.md` | "F3: Interview Debrief & Learning Loop" |
| AI prompts | `AI_PROMPTS.md` | "4. Interview Debrief Prompts" (4A, 4B) |
| AI role definition | `AI_SYSTEM_ROLES.md` | "4. DEBRIEF_ANALYST" |
| Testing | `IMPLEMENTATION_PLAN.md` | "How to Test (Phase 6)" |

### Phase 7: Quick Reference Cards Redesign

| Task | Read | Section to Find |
|------|------|----------------|
| Full redesign plan | `QUICK_REFERENCE_REDESIGN.md` | Entire document |
| Schema / migration | `DATA_MODEL.md` | "4. briefing_cache" |
| UI components | `FEATURE_SPECS.md` | "F4: Quick Reference Cards (Redesign)" |
| AI prompts | `AI_PROMPTS.md` | "7. Quick Reference Briefing Prompts" (7A) |
| AI role definition | `AI_SYSTEM_ROLES.md` | "7. BRIEFING_OFFICER" |
| Implementation steps | `IMPLEMENTATION_PLAN.md` | "Phase 7" |
| Testing | `IMPLEMENTATION_PLAN.md` | "How to Test (Phase 7)" |

### Phase 8: Mock Interview Simulator

| Task | Read | Section to Find |
|------|------|----------------|
| Schema / migration | `DATA_MODEL.md` | "5. mock_sessions" |
| TypeScript types | `DATA_MODEL.md` | TypeScript Types under mock_sessions |
| API routes & hooks | `IMPLEMENTATION_PLAN.md` | "Phase 8" → Steps 8.2, 8.3 |
| UI components | `FEATURE_SPECS.md` | "F5: Mock Interview Simulator" |
| AI prompts | `AI_PROMPTS.md` | "3. Mock Interview Prompts" (3A, 3B, 3C) |
| AI role definition | `AI_SYSTEM_ROLES.md` | "3. MOCK_INTERVIEWER" |
| Testing | `IMPLEMENTATION_PLAN.md` | "How to Test (Phase 8)" |

### Phase 9: Salary & Offer Negotiation

| Task | Read | Section to Find |
|------|------|----------------|
| Schema / migration | `DATA_MODEL.md` | "6. offer_details" |
| TypeScript types | `DATA_MODEL.md` | TypeScript Types under offer_details |
| API routes & hooks | `IMPLEMENTATION_PLAN.md` | "Phase 9" → Steps 9.2 |
| UI components | `FEATURE_SPECS.md` | "F6: Salary & Offer Negotiation Toolkit" |
| AI prompts | `AI_PROMPTS.md` | "5. Salary & Negotiation Prompts" (5A, 5B) |
| AI role definition | `AI_SYSTEM_ROLES.md` | "5. NEGOTIATION_STRATEGIST" |

### Phase 10: Skill Gap Analyzer

| Task | Read | Section to Find |
|------|------|----------------|
| No new table | — | Uses existing `applications.required_skills` + `cv_data` |
| API routes & hooks | `IMPLEMENTATION_PLAN.md` | "Phase 10" → Steps 10.1 |
| UI components | `FEATURE_SPECS.md` | "F7: Skill Gap Analyzer" |
| AI prompts | `AI_PROMPTS.md` | "6. Skill Gap Analyzer Prompts" (6A) |
| AI role definition | `AI_SYSTEM_ROLES.md` | "6. SKILL_MAPPER" |

---

## Task Type → Minimum Read Set

For common task types, here's the absolute minimum to read:

| Task Type | Documents to Read |
|-----------|-------------------|
| **Create a migration** | `DATA_MODEL.md` (only the relevant table section) |
| **Create API route** | `IMPLEMENTATION_PLAN.md` (phase step for routes) + `AI_PROMPTS.md` (if AI route) |
| **Create React hook** | `IMPLEMENTATION_PLAN.md` (phase step for hooks) + `DATA_MODEL.md` (types) |
| **Build UI component** | `FEATURE_SPECS.md` (feature spec with UI layout) |
| **Write/update AI prompt** | `AI_SYSTEM_ROLES.md` (role definition) + `AI_PROMPTS.md` (prompt template) |
| **Fix a bug** | None of these — read the source code directly |
| **Add tests** | `IMPLEMENTATION_PLAN.md` ("How to Test" section for the phase) |
| **Understand architecture** | `IMPLEMENTATION_PLAN.md` (overview + dependencies) + `DATA_MODEL.md` (ER diagram) |

---

## Existing Codebase Context (read from source, not docs)

When you need to understand HOW things currently work (not what to build), read source files:

| What | File(s) |
|------|---------|
| Existing AI prompts pattern | `lib/ai/prompts.ts` |
| Existing types pattern | `types/application.ts`, `types/cv.ts`, `types/ai.ts` |
| Existing React Query hooks | `hooks/use-applications.ts`, `hooks/index.ts` |
| Existing API route pattern | `app/api/save/route.ts`, `app/api/list/route.ts` |
| Existing prep UI | `components/dashboard/PrepPanel.js`, `components/dashboard/InterviewPrepTools.js` |
| Database connection | `lib/db.ts` or `lib/db.js` |
| Auth pattern | `auth.ts`, `middleware.ts` |
| UI component library | `components/ui/` (Shadcn) |
| Interview tracking UI | `components/dashboard/InterviewTimeline.tsx`, `components/dashboard/UpcomingInterviews.js` |
| Schema | `schema.sql` |

---

## Build Order & Dependencies

```
Phase 4 ──→ Phase 5 ──→ Phase 6 ──→ Phase 7
(Vault)     (Study)     (Debrief)   (Briefing)
   │            │            │           │
   │            │            │           └── Needs: Vault + Study + Debrief data
   │            │            └── Feeds back into: Study (adaptive) + Vault (suggestions)
   │            └── Links to: Vault answers in study context
   └── Standalone (needs only: CV + Application data)

Phase 8 ──→ Standalone but enhanced by Phase 4-6 data
(Mock)

Phase 9 ──→ Standalone, triggers on status = 'Offer Received'
(Negotiation)

Phase 10 ──→ Standalone, reads aggregated application data + CV
(Skill Gap)
```

**Rule:** Always complete a phase fully before starting the next.
**Rule:** Phase 7 requires Phases 4-6 to be done (it aggregates their data).
**Rule:** Phases 8, 9, 10 are independent of each other.

---

## Session Start Checklist

When beginning a new coding session:

1. Read THIS file (`docs/ROADMAP.md`) — you're already here
2. Identify which phase you're working on
3. Check `docs/IMPLEMENTATION_PLAN.md` for the phase checklist — find unchecked items
4. Read ONLY the documents listed in the phase routing table above
5. Check existing source files for patterns before writing new code
6. After implementing, follow "How to Test" in `IMPLEMENTATION_PLAN.md`

---

## Document Inventory

| File | Lines | Purpose | When to Read |
|------|-------|---------|-------------|
| `ROADMAP.md` | ~150 | Navigation index (this file) | Every session start |
| `AI_SYSTEM_ROLES.md` | 329 | 7 AI personas with constraints | When writing/editing AI prompts |
| `AI_PROMPTS.md` | 918 | 14 prompt templates + API mapping | When building AI API routes |
| `FEATURE_SPECS.md` | 509 | UI specs, user stories, acceptance criteria | When building UI components |
| `IMPLEMENTATION_PLAN.md` | 402 | Step-by-step build checklist per phase | Every session (specific phase section) |
| `QUICK_REFERENCE_REDESIGN.md` | 301 | Phase 7 detailed redesign plan | Only during Phase 7 |
| `DATA_MODEL.md` | 724 | SQL migrations + TypeScript types | When creating tables, types, or API routes |
