# Quick Reference Cards — Complete Redesign Plan

> The current prep system is **scattered**: talking points, questions, red flags, frameworks,
> quick reference card, company insights, SWOT — all live in separate panels with no hierarchy
> or unified view. This document defines the redesign strategy.

---

## Current State Analysis

### What Exists Today

```
PrepPanel.js (300 lines) renders these sections sequentially:
  1. Generate Button (if no personalized data)
  2. Role Snapshot (company, title, role summary, positioning)
  3. QuickReferenceCard (plain text dump: role + salary + talking points + questions)
  4. Anticipated Questions (InterviewQuestionsList — categorized, expandable)
  5. Questions You Should Ask (QuestionsToAskList — grouped by type)
  6. Red Flags (RedFlagsList — with evidence and probes)
  7. AI Hiring Frameworks (competency-based)
  8. Tech to Study (tag list)
  9. Interview Rounds (add/edit rounds with notes)
```

### Problems

| # | Problem | Impact |
|---|---------|--------|
| 1 | **No hierarchy** — Everything has equal visual weight. User doesn't know what to look at first. | Overwhelm, low usage |
| 2 | **QuickReferenceCard is a text blob** — Plain `<pre>` with monospace text. No structure, no round-awareness. | Useless for quick review |
| 3 | **No round-type adaptation** — Same content whether preparing for screening or final round. | Irrelevant prep for the round |
| 4 | **No vault integration** — Prepared answers from the vault don't appear in prep view. | Disconnected features |
| 5 | **No debrief integration** — Previous round feedback doesn't inform current round prep. | No learning loop |
| 6 | **Company insights in separate tab** — Culture, strategy, salary context not connected to prep flow. | Context switching |
| 7 | **Copy produces raw text** — Clipboard output is unstructured, not useful for quick review. | Poor mobile/print experience |
| 8 | **Study notes don't exist** — No structured, per-question preparation materials. | Ad-hoc preparation |

### Current Data Sources (Scattered)

```
Application record holds:
  ├── interview_prep_key_talking_points  → PrepPanel → QuickReferenceCard
  ├── interview_prep_questions_to_ask    → PrepPanel → QuestionsToAskList
  ├── interview_prep_potential_red_flags → PrepPanel → RedFlagsList
  ├── interview_prep_notes               → PrepPanel → InterviewQuestionsList
  │     ├── likelyInterviewQuestions
  │     └── techStackToStudy
  ├── interview_stages                   → PrepPanel → Interview Rounds
  ├── personalized_analysis              → PrepPanel → Hiring Frameworks
  ├── role_summary                       → PrepPanel → Role Snapshot
  └── company_info                       → CompanyTab (separate tab!)

After new features:
  ├── vault answers                      → VaultTab (separate!)
  ├── study packages                     → StudyView (separate!)
  └── debrief data                       → DebriefView (separate!)
```

**Problem: 10+ data sources, 4+ separate views, no unified consumption point.**

---

## Redesign: Unified Briefing System

### Design Philosophy

```
BEFORE: "Here's all your data, organized by source"
AFTER:  "Here's exactly what you need, organized by what matters NOW"
```

The new system has two modes:

1. **Full Prep View** — Detailed, organized panels (for deep preparation, hours/days before)
2. **Briefing Card Mode** — Compressed, prioritized, scannable (for 3-minute review, minutes before)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PREP VIEW (default)                      │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Study   │ │ Vault   │ │ Company │ │ Debrief │  ← Organized panels│
│  │ Notes   │ │ Answers │ │ Intel   │ │ Insights│           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                              │
│  [🎯 Generate Briefing Card]                                │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│              BRIEFING CARD (overlay/drawer)                   │
│                                                              │
│  ╔═══════════════════════════════════════════╗               │
│  ║ 🔴 KNOW THIS (Critical)                  ║               │
│  ║ • Company focus: scaling to 10M users     ║               │
│  ║ • Your angle: "I led migration to micro"  ║               │
│  ║ • Salary range: $120-150K (above market)  ║               │
│  ╠═══════════════════════════════════════════╣               │
│  ║ 📖 YOUR STORIES                           ║               │
│  ║ If asked about scale → Vault #3: "Redis"  ║               │
│  ║ If asked about team  → Vault #7: "Led 8"  ║               │
│  ╠═══════════════════════════════════════════╣               │
│  ║ ⚡ MENTION THESE (Quick Wins)             ║               │
│  ║ 1. Your K8s migration experience          ║               │
│  ║ 2. Open source contribution to React      ║               │
│  ║ 3. "I read about your Series B—congrats"  ║               │
│  ╠═══════════════════════════════════════════╣               │
│  ║ ⚠️ CAUTION                                ║               │
│  ║ • "Fast-paced" → could mean understaffed  ║               │
│  ║   Ask: "How big is the team currently?"   ║               │
│  ╠═══════════════════════════════════════════╣               │
│  ║ ❓ ASK THEM                               ║               │
│  ║ 1. "What does success look like at 90d?"  ║               │
│  ║ 2. "How do you handle tech debt?"         ║               │
│  ╠═══════════════════════════════════════════╣               │
│  ║ ✅ FINAL CHECK                            ║               │
│  ║ • Laptop charged, IDE open to portfolio   ║               │
│  ║ • Water nearby, quiet room confirmed      ║               │
│  ║ • Smile, take a breath, you're prepared   ║               │
│  ╚═══════════════════════════════════════════╝               │
│                                                              │
│  [📋 Copy Briefing]  [📱 Mobile View]  [🔄 Regenerate]     │
└─────────────────────────────────────────────────────────────┘
```

### Briefing Card Content Sources

| Section | Data Source | Round Adaptation |
|---------|------------|-----------------|
| KNOW THIS | company_info, role_summary, salary, company insights | Screening: company + salary focus. Technical: tech stack focus. |
| YOUR STORIES | Vault answers matched to likely questions | Behavioral: STAR stories. Technical: project stories. |
| MENTION THESE | CV highlights + JD overlap + study quick wins | Always the top 3 skill matches |
| CAUTION | Red flags + debrief insights from previous rounds | Include previous round feedback |
| ASK THEM | Questions to ask (filtered by round type) | Screening: role clarity. Final: culture/growth. |
| FINAL CHECK | Static checklist + logistics | Technical: have IDE/whiteboard ready |

### Round-Type Content Priority

```
SCREENING ROUND:
  Priority 1: Company overview + why you're interested
  Priority 2: Your 30-second pitch (adapted for this role)
  Priority 3: Salary expectations
  Priority 4: Questions about the process

TECHNICAL ROUND:
  Priority 1: Key technical skills to demonstrate
  Priority 2: Your relevant projects (vault stories)
  Priority 3: System design patterns to mention
  Priority 4: Previous round feedback (if exists)

BEHAVIORAL ROUND:
  Priority 1: Top 3 STAR stories from vault
  Priority 2: Company values to mirror in answers
  Priority 3: Conflict/failure/leadership prepared stories
  Priority 4: Red flags to probe diplomatically

FINAL ROUND:
  Priority 1: Culture fit angles + enthusiasm drivers
  Priority 2: Strategic questions that show deep understanding
  Priority 3: Negotiation prep points
  Priority 4: "Why this company over competitors"
```

---

## Component Architecture

### New Components

```
components/briefing/
  ├── BriefingCard.tsx          — Main container with all sections
  ├── BriefingSection.tsx       — Collapsible section with priority badge
  ├── BriefingStoryTrigger.tsx  — "If they ask X → use vault answer Y"
  ├── BriefingQuickWins.tsx     — 3 quick win badges
  ├── BriefingCaution.tsx       — Red flags with diplomatic probes
  ├── BriefingQuestions.tsx     — Questions to ask (round-filtered)
  ├── BriefingCopyButton.tsx    — Structured clipboard output
  └── BriefingMobileSheet.tsx   — Mobile-optimized sheet/drawer
```

### Modified Components

```
PrepPanel.js → PrepPanel.tsx
  BEFORE: Renders all sections sequentially
  AFTER:  Renders organized panels + "Generate Briefing" button
          Briefing Card appears as overlay/drawer on top

InterviewPrepTools.js
  BEFORE: Standalone components (QuickReferenceCard)
  AFTER:  QuickReferenceCard deprecated, replaced by BriefingCard
```

### Data Aggregation Hook

```typescript
// hooks/use-briefing.ts
const useBriefingData = (applicationId: number, roundType: string) => {
  // Aggregates from multiple sources:
  const application = useApplicationFromList(applicationId);
  const vaultAnswers = useVaultAnswers({ skills: application.required_skills });
  const studyPackage = useStudyPackage(applicationId, roundIndex);
  const debriefs = useDebriefs(applicationId);
  const companyInsights = application.company_info;

  // Returns unified briefing data
  return {
    application,
    relevantVaultAnswers: matchVaultToJob(vaultAnswers, application),
    studyQuickWins: studyPackage?.quickWins,
    previousRoundInsights: extractDebriefInsights(debriefs),
    companyContext: companyInsights,
    roundType,
  };
};
```

---

## Copy Output Format

When user clicks "Copy Briefing", the clipboard receives:

```
═══════════════════════════════════════
🎯 INTERVIEW BRIEFING
Senior Frontend Engineer @ Spotify
Technical Round — March 5, 2026 14:00
═══════════════════════════════════════

🔴 KNOW THIS
• They're scaling their podcast platform (10M+ daily users)
• Your angle: "I led a similar scale migration at [Company]"
• Stack: React, TypeScript, GraphQL, K8s

📖 YOUR STORIES
• If asked about scale → "Redis caching project — 60% latency reduction"
• If asked about teamwork → "Led 8-person cross-functional team"
• If asked about failure → "Deployment rollback story — zero data loss"

⚡ MENTION THESE
1. Your open-source contribution to React Query
2. Experience with micro-frontends at scale
3. "I noticed you recently open-sourced X — I found it interesting"

⚠️ WATCH OUT
• "Fast-paced" mentioned 3x → could mean understaffed
  → Ask: "How large is the current frontend team?"

❓ ASK THEM
1. "What does a successful first quarter look like for this role?"
2. "How does the team handle technical debt prioritization?"

✅ READY
• IDE open with portfolio project
• Water nearby, quiet room
• Deep breath — you're prepared
═══════════════════════════════════════
```

---

## Migration Strategy

### Phase 1: Build New (don't break old)
- Build `BriefingCard` as new component alongside existing `QuickReferenceCard`
- Add "Generate Briefing" button in PrepPanel that opens the new card
- Old PrepPanel layout unchanged

### Phase 2: Replace
- Replace `QuickReferenceCard` import with `BriefingCard`
- Remove old component
- Update PrepPanel layout to support briefing overlay

### Phase 3: Unify
- Connect vault answers, study notes, debrief data to briefing generation
- Full AI-generated briefing with `BRIEFING_GENERATE_PROMPT`
- Auto-generate when interview < 24 hours away

---

## Mobile Optimization

The briefing card is the most likely feature to be used on a phone (reviewing notes before walking into an interview).

### Mobile Design Principles
- Single column, no horizontal scroll
- Large touch targets (min 44px)
- Collapsible sections (start with KNOW THIS expanded, rest collapsed)
- Swipe between sections
- Offline capability (cached via service worker / PWA)
- Dark mode default (low-light waiting room)

### Mobile Sheet Behavior
- Opens as full-screen sheet (bottom-up animation)
- Sticky header with role + company
- Section navigation at top (scrollable pill tabs)
- "Close" at bottom, not top (reachable with thumb)
