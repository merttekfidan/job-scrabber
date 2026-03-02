# Feature Specifications — HuntIQ Interview Intelligence Engine

> Detailed specs for all 7 features. Each spec includes user stories, acceptance criteria,
> UI/UX description, data flow, and edge cases.

---

## Feature Registry

| # | Feature | Priority | Effort | AI Role |
|---|---------|----------|--------|---------|
| F1 | Interview Answer Vault | P0 | Medium | VAULT_COACH |
| F2 | Smart Study Notes | P0 | Medium | STUDY_ARCHITECT |
| F3 | Interview Debrief & Learning Loop | P1 | Medium | DEBRIEF_ANALYST |
| F4 | Quick Reference Cards (Redesign) | P1 | Low-Medium | BRIEFING_OFFICER |
| F5 | Mock Interview Simulator | P2 | High | MOCK_INTERVIEWER |
| F6 | Salary & Offer Negotiation | P3 | Medium | NEGOTIATION_STRATEGIST |
| F7 | Skill Gap Analyzer | P3 | Medium | SKILL_MAPPER |

---

## F1: Interview Answer Vault

### Summary
A personal library of prepared interview answers organized by question category. Users store, refine, and adapt their best answers. AI helps generate, improve, and customize answers for specific roles.

### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| F1-1 | job seeker | save my best interview answers organized by category | I can quickly access them before any interview |
| F1-2 | job seeker | have AI generate a STAR answer from my CV for a given question | I don't start from a blank page |
| F1-3 | job seeker | submit my own answer and get AI feedback with improvement suggestions | my answers get stronger over time |
| F1-4 | job seeker | adapt an existing vault answer to a specific job I'm applying to | my answers are tailored, not generic |
| F1-5 | job seeker | tag answers as "used", "worked well", "needs improvement" | I can track which answers perform best in real interviews |
| F1-6 | job seeker | search my vault by category, keyword, or skill | I find the right answer quickly before an interview |

### Question Categories
```
BEHAVIORAL:
  - "Tell me about yourself" (with role-specific variations)
  - "Greatest strength / weakness"
  - "Describe a conflict and how you resolved it"
  - "Tell me about a time you failed"
  - "Describe a time you led a project"
  - "How do you handle pressure/tight deadlines?"
  - "Tell me about a time you had to learn something quickly"

SITUATIONAL:
  - "What would you do if you disagreed with your manager?"
  - "How would you prioritize competing deadlines?"
  - "Describe how you'd onboard into this role in the first 90 days"

TECHNICAL:
  - Role-specific technical questions (dynamic, based on required_skills)
  - System design questions
  - Problem-solving / debugging scenarios

ROLE-SPECIFIC:
  - "Why this company?"
  - "Why this role?"
  - "Where do you see yourself in 5 years?"
  - "What makes you the right fit?"
  - "Salary expectations?"
```

### UI/UX Specification

**Access Point:** New top-level tab in the application detail view OR standalone `/vault` page.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ 🗃️ Interview Answer Vault                    [+ New Answer] │
├──────────────────────────────────────────────────────────┤
│ [All] [Behavioral] [Situational] [Technical] [Role-Specific] │
│ 🔍 Search vault...                                        │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐  │
│ │ Q: "Tell me about a time you led a project"         │  │
│ │ Category: Behavioral  │  Tags: ✅ Used  ⭐ Worked │  │
│ │ ──────────────────────────────────────────────────  │  │
│ │ S: Led the migration of our monolith to micro...    │  │
│ │ T: I was responsible for coordinating 3 teams...    │  │
│ │ A: I created a phased rollout plan with...          │  │
│ │ R: Reduced deployment time by 60%, zero downtime... │  │
│ │ ──────────────────────────────────────────────────  │  │
│ │ [✏️ Edit] [🤖 Improve with AI] [🎯 Adapt to Job]   │  │
│ │ Key phrases: "phased rollout", "60% reduction"      │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Q: "Why do you want to work here?"                  │  │
│ │ Category: Role-Specific  │  Tags: 📝 Draft          │  │
│ │ ... (collapsed)                                     │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Answer Creation Flow:**
1. User clicks "+ New Answer"
2. Select question from predefined list OR write custom question
3. Choose: "Write my own" or "AI Generate from CV"
4. If AI: selects question + optionally links to specific job → AI generates STAR answer
5. If manual: structured STAR form with S/T/A/R fields + free-text option
6. Save → appears in vault with category tag

**Answer Adaptation Flow:**
1. User is on application detail page → sees their vault answers
2. Clicks "Adapt for this role" on any answer
3. AI takes the original answer + this job's description → produces adapted version
4. User reviews, edits, saves as new variant (original preserved)

### Acceptance Criteria
- [ ] User can CRUD answers in the vault
- [ ] Answers are organized by category with filter/search
- [ ] AI can generate a STAR answer given a question + CV
- [ ] AI can refine an existing user-written answer
- [ ] AI can adapt a vault answer to a specific job application
- [ ] Answers have tags: Draft, Ready, Used, Worked Well, Needs Improvement
- [ ] Vault answers appear in prep view when relevant to the application
- [ ] Answers display key phrases for quick memory anchoring
- [ ] Maximum 250 words per answer enforced (with character count)

### Edge Cases
- User has no CV uploaded → AI generation uses job description only, warns about limited personalization
- Answer is too long → show word count, suggest AI compression
- Multiple answers for same question → show all variants, highlight "best performing"

---

## F2: Smart Study Notes

### Summary
AI-generated, round-specific study packages that transform job data into structured preparation materials. Each package is tailored to the specific round type, job requirements, and user's CV profile.

### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| F2-1 | job seeker | get a study package when I schedule an interview round | I know exactly what to prepare |
| F2-2 | job seeker | see questions categorized as Offer-Specific, Skill-Based, HR, Situational | I can allocate study time correctly |
| F2-3 | job seeker | add my own notes to each predicted question | I can personalize my preparation |
| F2-4 | job seeker | see study time allocation recommendations | I don't over-prepare for the wrong thing |
| F2-5 | job seeker | have AI adapt the study package if my previous debrief shows weak areas | my preparation evolves with my performance |
| F2-6 | job seeker | see difficulty ratings per question | I focus on harder questions first |

### UI/UX Specification

**Access Point:** Within each interview round in PrepPanel, and as a dedicated section in InterviewsTab.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ 📚 Study Package — Technical Round (Round 2)              │
│ ⏰ Interview in 3 days │ Estimated prep: 4-6 hours        │
├──────────────────────────────────────────────────────────┤
│ TIME ALLOCATION                                           │
│ ████████████░░░░░░░░ Technical: 60%                      │
│ █████░░░░░░░░░░░░░░░ Behavioral: 25%                    │
│ ███░░░░░░░░░░░░░░░░░ Company: 15%                       │
├──────────────────────────────────────────────────────────┤
│ OFFER-SPECIFIC (3 questions)                      ⭐⭐⭐  │
│ ┌──────────────────────────────────────────────────┐    │
│ │ Q: "How would you architect X for our scale?"     │    │
│ │ Difficulty: ⭐⭐⭐⭐ │ Source: "handle 10M req/day" │    │
│ │ 💡 Hint: Reference your work on Y from CV...      │    │
│ │ 📝 Your notes: [editable text area]               │    │
│ │ [🤖 Enhance notes with AI]                        │    │
│ └──────────────────────────────────────────────────┘    │
│                                                          │
│ SKILL-BASED (5 questions)                         ⭐⭐   │
│ ...                                                      │
│                                                          │
│ HR/BEHAVIORAL (3 questions)                       ⭐     │
│ ...                                                      │
│                                                          │
│ MUST-KNOW FACTS                                          │
│ 🔴 Critical: Company raised Series B last month          │
│ 🟡 Important: They use microservices on K8s              │
│ 🟢 Useful: CEO background is in engineering              │
│                                                          │
│ ⚡ QUICK WINS — Mention these to signal competence:      │
│ 1. Your experience with [specific matching technology]    │
│ 2. Your project at [company] that handled similar scale   │
│ 3. Your familiarity with [industry trend they care about] │
└──────────────────────────────────────────────────────────┘
```

### Study Package Generation Flow
1. User adds an interview round (type + date)
2. System auto-generates study package based on round type
3. Package appears attached to that round
4. User can add notes, mark questions as "prepared", regenerate
5. If debrief data exists from previous rounds → package adapts

### Acceptance Criteria
- [ ] Study package auto-generates when interview round is created
- [ ] Package is specific to round type (Screening/Technical/Behavioral/Final)
- [ ] Questions categorized: Offer-Specific, Skill-Based, HR/Behavioral, Situational
- [ ] Each question has difficulty rating (1-5 stars)
- [ ] Each question has source link to specific JD requirement
- [ ] User can add/edit personal notes on each question
- [ ] AI can enhance user's notes with additional context
- [ ] Time allocation breakdown visible
- [ ] Must-know facts section with priority levels
- [ ] Quick Wins section with 3 conversation starters
- [ ] Questions marked as "prepared" tracked (progress indicator)
- [ ] If previous debrief exists, weak areas get more questions

---

## F3: Interview Debrief & Learning Loop

### Summary
Post-interview reflection system where users log what happened, how they felt, and what they'd improve. AI analyzes debriefs over time to identify patterns and drive continuous improvement.

### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| F3-1 | job seeker | quickly log what questions were asked after an interview | I don't forget details |
| F3-2 | job seeker | rate my confidence per answer (1-5) | I track where I'm strong/weak |
| F3-3 | job seeker | write "what I wish I said" for each question | I improve for next time |
| F3-4 | job seeker | see AI analysis of my debrief patterns over time | I understand my trajectory |
| F3-5 | job seeker | get "next interview focus" recommendations | I know exactly what to practice |
| F3-6 | job seeker | see my weak areas automatically reflected in future study packages | my prep evolves |

### UI/UX Specification

**Debrief Form (Post-Interview):**
```
┌──────────────────────────────────────────────────────────┐
│ 📝 Interview Debrief — Round 2 (Technical) at Spotify     │
│ Date: 2026-03-01                                          │
├──────────────────────────────────────────────────────────┤
│ OVERALL FEELING                                           │
│ 😟 1  😐 2  🙂 3  😊 4  🤩 5    [Selected: 3]           │
│                                                           │
│ QUESTIONS ASKED                                           │
│ ┌──────────────────────────────────────────────────┐     │
│ │ Q1: [What question were you asked?              ] │     │
│ │ Category: [Technical ▾]                           │     │
│ │ My answer (brief): [I explained how I would... ] │     │
│ │ Confidence: ⭐⭐⭐☆☆ (3/5)                       │     │
│ │ What I wish I said: [Should have mentioned...  ] │     │
│ └──────────────────────────────────────────────────┘     │
│                                                           │
│ [+ Add another question]                                  │
│                                                           │
│ GENERAL NOTES                                             │
│ [Free text area for overall impressions]                  │
│                                                           │
│ INTERVIEWER VIBE                                          │
│ [Friendly] [Neutral] [Challenging] [Hostile]              │
│                                                           │
│ [💾 Save Debrief]  [🤖 Analyze with AI]                   │
└──────────────────────────────────────────────────────────┘
```

**AI Analysis View (after 1+ debriefs):**
```
┌──────────────────────────────────────────────────────────┐
│ 📊 Interview Performance Insights                         │
├──────────────────────────────────────────────────────────┤
│ CONFIDENCE MAP                                            │
│ Technical:    ████████░░ 4.0 avg  ↑ improving             │
│ Behavioral:   █████░░░░░ 2.5 avg  → stable               │
│ Situational:  ██████░░░░ 3.0 avg  ↑ improving             │
│ Role-Specific: ███████░░░ 3.5 avg  → stable               │
│                                                           │
│ 🎯 NEXT INTERVIEW FOCUS                                   │
│ 1. Practice behavioral STAR stories (lowest confidence)   │
│ 2. Prepare 2 more conflict resolution examples            │
│ 3. Add "leadership under pressure" story to vault         │
│                                                           │
│ 📈 PATTERNS DETECTED (3+ debriefs)                        │
│ • You consistently score lower on "weakness" questions    │
│ • Technical confidence is trending upward (+0.5/interview)│
│ • "What I wish I said" often mentions quantified results  │
│   → ACTION: Add more metrics to your vault answers        │
│                                                           │
│ 💡 VAULT SUGGESTIONS                                      │
│ Based on your debriefs, add these to your Answer Vault:   │
│ • "Describe a time you handled a difficult stakeholder"   │
│ • "How do you approach system design at scale?"           │
└──────────────────────────────────────────────────────────┘
```

### Data Flow
1. Interview happens → user fills debrief form
2. Debrief saved to `interview_debriefs` table
3. AI analyzes current + historical debriefs
4. Insights update confidence map and pattern detection
5. Weak areas feed back into Study Notes generation for next interview
6. Vault suggestions created for recurring question types
7. If 3+ debriefs exist, trend analysis auto-generates

### Acceptance Criteria
- [ ] Debrief form accessible from interview round detail
- [ ] Form captures: questions asked, self-answers, confidence scores, "wish I said", overall feeling
- [ ] AI analyzes individual debrief and provides insights
- [ ] After 3+ debriefs, trend analysis with patterns and trajectory
- [ ] Confidence map visualization (per question category)
- [ ] "Next Interview Focus" — top 3 actionable recommendations
- [ ] Vault suggestions generated from debrief gaps
- [ ] Weak areas automatically influence next study package generation
- [ ] Debrief data persists and is searchable

---

## F4: Quick Reference Cards (Redesign)

### Summary
Complete redesign of the existing scattered prep information into a unified, hierarchical, mobile-friendly briefing system. The current `QuickReferenceCard` is text-only with limited info. The new system is round-type-aware, structured with priority levels, and designed for 3-minute consumption.

> **See detailed redesign plan:** `docs/QUICK_REFERENCE_REDESIGN.md`

### Current Problems
1. Existing `QuickReferenceCard` is a plain text dump — no hierarchy, no visual structure
2. Prep data scattered across PrepPanel sections (talking points, questions, red flags, frameworks — all separate)
3. No round-type awareness — same card whether it's a screening or final round
4. No integration with user's vault answers or debrief insights
5. Not mobile-optimized for last-minute review
6. Copy-to-clipboard produces raw text, not structured brief

### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| F4-1 | job seeker | see a single, unified briefing card before my interview | I have everything in one place |
| F4-2 | job seeker | have the card adapt based on my interview round type | I see the most relevant info first |
| F4-3 | job seeker | see my vault answers integrated into the briefing | I'm reminded of my prepared stories |
| F4-4 | job seeker | scan the card in under 3 minutes | I can review it right before walking in |
| F4-5 | job seeker | see priority levels (Critical / Important / Useful) | I know what matters most |
| F4-6 | job seeker | have previous round debrief insights in the card | I build on previous rounds |

### Acceptance Criteria
- [ ] Unified card replaces current scattered prep sections (when in "briefing mode")
- [ ] Card adapts content priority based on round type
- [ ] Hierarchical structure: CRITICAL → IMPORTANT → USEFUL
- [ ] Integrates data from: prep notes, vault answers, company insights, study notes, debrief insights
- [ ] Under 500 words total
- [ ] Mobile-responsive design
- [ ] Copy produces clean, structured brief
- [ ] Auto-generates when interview is within 24 hours (notification prompt)

---

## F5: Mock Interview Simulator

### Summary
AI-powered practice interview sessions where the AI asks questions as a hiring manager, user responds, and AI evaluates with a detailed rubric. Post-session debrief with scores and improvement areas.

### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| F5-1 | job seeker | start a mock interview for a specific round type | I practice realistically |
| F5-2 | job seeker | answer questions by typing and get real-time follow-ups | it feels like a real interview |
| F5-3 | job seeker | choose difficulty level (Easy/Medium/Hard) | I match my comfort level |
| F5-4 | job seeker | get a detailed scorecard after the mock session | I know exactly where to improve |
| F5-5 | job seeker | see my mock scores improve over time | I see measurable progress |
| F5-6 | job seeker | have the mock use questions from my study package | practice is aligned with preparation |

### UI/UX Specification

**Mock Session Interface:**
```
┌──────────────────────────────────────────────────────────┐
│ 🎙️ Mock Interview — Technical Round                       │
│ Company: Spotify │ Difficulty: Medium │ Q 3/6             │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ 👤 INTERVIEWER:                                           │
│ ┌──────────────────────────────────────────────────┐     │
│ │ "That's interesting. You mentioned using Redis    │     │
│ │  for caching. Can you walk me through how you'd   │     │
│ │  handle cache invalidation at scale?"             │     │
│ └──────────────────────────────────────────────────┘     │
│                                                           │
│ 💬 YOUR RESPONSE:                                         │
│ ┌──────────────────────────────────────────────────┐     │
│ │                                                    │     │
│ │ [Type your answer here...]                        │     │
│ │                                                    │     │
│ └──────────────────────────────────────────────────┘     │
│ ⏱️ 2:30 elapsed │ 📝 ~180 words                          │
│                                                           │
│ [Submit Answer]                    [End Session Early]    │
└──────────────────────────────────────────────────────────┘
```

**Post-Mock Scorecard:**
```
┌──────────────────────────────────────────────────────────┐
│ 📊 Mock Interview Results — Score: 72/100 (B)            │
│ Verdict: LEAN HIRE                                        │
├──────────────────────────────────────────────────────────┤
│ CATEGORY SCORES                                           │
│ Technical:     ████████░░ 80                              │
│ Communication: ███████░░░ 70                              │
│ Structure:     ██████░░░░ 60                              │
│ Impact:        ████████░░ 78                              │
│                                                           │
│ QUESTION-BY-QUESTION                                      │
│ Q1: "Tell me about your architecture experience"          │
│     Score: 85 ✅ Strong — good use of specific examples   │
│                                                           │
│ Q2: "How would you handle cache invalidation?"            │
│     Score: 60 ⚠️ Needs Work — add trade-offs discussion   │
│     Rewrite suggestion: "Start with the problem scope..." │
│                                                           │
│ TOP STRENGTHS                                             │
│ • Clear communication of complex technical concepts       │
│ • Strong use of real-world examples from past experience  │
│                                                           │
│ TOP IMPROVEMENTS                                          │
│ • Structure answers with problem → approach → trade-offs  │
│   Exercise: Practice "think aloud" narration for 5 min    │
│ • Quantify results more — add metrics to every story      │
│                                                           │
│ 🎯 NEXT SESSION FOCUS: Answer structure (STAR compliance) │
│                                                           │
│ [Start Another Mock]  [Save to Debrief]  [Share Results]  │
└──────────────────────────────────────────────────────────┘
```

### Technical Flow
1. User selects: Application → Round Type → Difficulty
2. AI generates interview plan (5-7 questions, not shown to user)
3. Questions presented one at a time, chat-style
4. Each answer evaluated silently (stored, not shown)
5. After all questions → comprehensive debrief generated
6. Scores saved to `mock_sessions` table
7. Mock data feeds into debrief trend analysis

### Acceptance Criteria
- [ ] User can start mock for any application + round type
- [ ] 3 difficulty levels: Easy, Medium, Hard
- [ ] Chat-style interface (question → answer → next question)
- [ ] Timer and word count visible
- [ ] Follow-up questions based on answer quality
- [ ] Comprehensive post-mock scorecard with rubric scores
- [ ] Per-question feedback with rewrite suggestions
- [ ] Mock results saved and tracked over time
- [ ] Results can be saved as debrief data

---

## F6: Salary & Offer Negotiation Toolkit

### Summary
When an application reaches "Offer Received" status, a negotiation toolkit activates with market benchmarking, negotiation scripts, and multi-offer comparison.

### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| F6-1 | job seeker | input offer details when I receive an offer | the system can analyze it |
| F6-2 | job seeker | see how my offer compares to market rates | I know if it's fair |
| F6-3 | job seeker | get a negotiation script with exact phrasing | I feel confident negotiating |
| F6-4 | job seeker | compare multiple offers side-by-side | I make the best decision |
| F6-5 | job seeker | get counter-offer strategies | I maximize my compensation |

### UI Trigger
- Automatically surfaces when `status = 'Offer Received'`
- New section in application detail: "Offer & Negotiation" tab

### Acceptance Criteria
- [ ] Offer input form: base, bonus, equity, benefits, other
- [ ] Market rate benchmarking with confidence level
- [ ] Total compensation calculation
- [ ] Negotiation script (verbal + email template)
- [ ] Multi-offer comparison matrix (if multiple offers)
- [ ] Counter-offer strategy with risk assessment
- [ ] Walk-away threshold calculator

---

## F7: Skill Gap Analyzer

### Summary
Aggregates required skills from all active applications, compares against user's CV, and produces a skill gap map with prioritized learning paths.

### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| F7-1 | job seeker | see which skills I'm missing across my target jobs | I know what to learn |
| F7-2 | job seeker | see my skill gaps ranked by demand frequency | I prioritize high-impact skills |
| F7-3 | job seeker | get specific learning resources for each gap | I know where to start |
| F7-4 | job seeker | see my strong matches highlighted | I know my strengths |
| F7-5 | job seeker | see which existing skills can bridge to required skills | I position myself better |

### UI Location
- New section in Coach page or standalone dashboard widget
- Also accessible from application detail as skill match indicator

### Acceptance Criteria
- [ ] Aggregates required_skills from all user's applications
- [ ] Cross-references with CV skills
- [ ] 4-tier match system: Strong Match, Partial Match, Bridge, Gap
- [ ] Gaps ranked by demand frequency × criticality
- [ ] Top 5 priority gaps with learning resources
- [ ] Time-to-competency estimates
- [ ] Bridge strategies for transferable skills
- [ ] Market insight summary
- [ ] Visual skill map (radar chart or heatmap)
