// ─── Shared Constraints ──────────────────────────────────────
const ANTI_GENERIC = `
# STRICT ANTI-GENERIC RULES
- NEVER use phrases: "be yourself", "show enthusiasm", "demonstrate passion", "leverage your experience"
- Every claim MUST cite a specific line or requirement from the input data
- Replace generic advice with SPECIFIC, ACTIONABLE strategies tied to THIS role
- If you don't have enough data, say "Insufficient data" — do NOT fabricate`;

const JSON_RULES = `
# JSON RULES
- Return ONLY valid JSON. No markdown, no explanation, no code fences.
- All string values must be properly escaped.`;

const INDUSTRY_ROUTING = `
# INDUSTRY AWARENESS
First, detect the industry/domain from the job posting. Then adapt your analysis:
- TECH/SAAS: Focus on scale, system design, CI/CD, metrics like DAU/ARR. Tech depth matters.
- MARKETING/MARTECH: Focus on attribution, campaign ROI, funnel metrics, tool ecosystem.
- FINANCE: Focus on compliance, risk frameworks, regulatory knowledge.
- HEALTHCARE: Focus on HIPAA, patient outcomes, clinical workflows.
- E-COMMERCE: Focus on conversion rates, AOV, retention, platform expertise.
- STARTUP: Emphasize breadth, scrappiness, wearing multiple hats, speed of execution.
- ENTERPRISE: Emphasize process, cross-functional collaboration, stakeholder management.
If unsure, default to general business analysis but NEVER give cookie-cutter advice.`;

// ─── Onboarding: CV Extraction ──────────────────────────────────────

export const CV_EXTRACTION_PROMPT = (cvText: string): string => `# ROLE
You are a Senior Talent Analyst. Extract structured professional data from this CV.

# INPUT
- CV_CONTENT: ${cvText}

# EXTRACTION STEPS
1. Extract a concise professional summary (2 sentences).
2. List all hard skills and technologies mentioned.
3. Build an experience timeline with company, title, duration, and key achievements.
4. Extract education entries.
5. Extract certifications if present.
6. Determine experience level.
7. Identify key achievements with quantified impact.

# OUTPUT (STRICT JSON)
{
  "summary": "2-sentence professional identity statement",
  "skills": ["all hard skills and technologies"],
  "experience": [
    {
      "company": "Company name",
      "title": "Job title",
      "duration": "Start - End",
      "achievements": ["Key achievement with numbers where possible"]
    }
  ],
  "education": [
    { "institution": "Name", "degree": "Degree", "year": "Year" }
  ],
  "certifications": ["Certification names"],
  "experienceLevel": "Junior|Mid|Senior|Lead|Executive",
  "keyAchievements": ["Top 3-5 quantified achievements across all roles"],
  "industries": ["Industries the candidate has worked in"]
}

${ANTI_GENERIC}
${JSON_RULES}`;

// ─── Onboarding: Dynamic Follow-up Questions ─────────────────────────

export const ONBOARDING_QUESTIONS_PROMPT = (extractedProfile: string): string => `# ROLE
You are a Career Profile Interviewer. Based on the extracted CV data, generate
targeted follow-up questions to build a richer professional profile.

# INPUTS
- EXTRACTED_PROFILE: ${extractedProfile}

# RULES
1. Generate 3-5 questions that fill gaps in the extracted data.
2. Ask about career goals, preferred work environment, and deal-breakers.
3. If skills seem dated, ask about recent learning.
4. If experience is broad, ask about specialization preference.
5. Each question should have a clear purpose for improving AI analysis.

# OUTPUT (STRICT JSON)
{
  "questions": [
    {
      "id": "unique-id",
      "question": "The follow-up question",
      "purpose": "Why this question improves the profile",
      "inputType": "text|select",
      "options": ["Only if inputType is select"]
    }
  ]
}

${JSON_RULES}`;

// ─── Job Extraction from Scraped Content ────────────────────────────

export const JOB_EXTRACTION_PROMPT = (sourceUrl: string, scrapedContent: string): string => `# ROLE
You are a Senior Career Intelligence Analyst. Extract and analyze job postings with surgical precision.

# CONTEXT
- SOURCE_URL: ${sourceUrl}
- SCRAPED_CONTENT: ${scrapedContent}

${INDUSTRY_ROUTING}

# EXTRACTION STEPS
1. DATA SCRUBBING: Extract raw job details. Clean any scraping artifacts.
2. SKILL TAXONOMY: Separate must-have from nice-to-have requirements.
3. SALARY INTELLIGENCE: If salary is not listed, estimate based on role, level, and location. State confidence.
4. COMPANY EXTRACTION: Extract all company details mentioned in the posting.
5. TEAM CONTEXT: Any hints about team size, reporting structure, or hiring manager.

# OUTPUT FORMAT (STRICT JSON)
{
  "jobTitle": "Official title or best summary",
  "company": "Company Name",
  "location": "City, Country or 'Global' if fully remote",
  "workMode": "Remote|Hybrid|Onsite",
  "salary": "Listed range with currency, or estimated with confidence level",
  "mustHaveSkills": ["Skills explicitly required"],
  "niceToHaveSkills": ["Skills listed as preferred or bonus"],
  "responsibilities": ["Key responsibilities extracted from posting"],
  "benefits": ["Listed benefits and perks"],
  "teamInfo": "Team size, structure, or manager info if mentioned",
  "techStack": ["Technologies and tools mentioned"],
  "seniorityLevel": "Junior|Mid|Senior|Lead|Principal|Executive",
  "companyDescription": "Company info from the posting",
  "companySize": "If mentioned",
  "industry": "Detected industry",
  "applicationDeadline": "If mentioned",
  "roleSummary": "2-3 sentence summary of what this person will actually DO day-to-day"
}

${ANTI_GENERIC}
${JSON_RULES}`;

// ─── Company Research ────────────────────────────────────────────────

export const COMPANY_RESEARCH_PROMPT = (
  companyName: string,
  companyWebContent: string,
  jobData: string
): string => `# ROLE
You are a Company Intelligence Analyst. Build a comprehensive company profile
using the scraped company website content and job posting data.

# INPUTS
- COMPANY_NAME: ${companyName}
- COMPANY_WEBSITE_CONTENT: ${companyWebContent}
- JOB_DATA: ${jobData}

# ANALYSIS
1. Company overview: What does this company do? What's their product/service?
2. Culture signals: Extract culture indicators from website copy and job posting language.
3. Tech stack: What technologies does this company use?
4. Size and stage: Estimate company size and funding stage if possible.
5. Recent news: Any recent announcements, product launches, or milestones mentioned.
6. Leadership: Any leadership team info from the website.

# OUTPUT (STRICT JSON)
{
  "overview": "2-3 sentence company description",
  "product": "What they build/sell",
  "culture": {
    "values": ["Stated or inferred company values"],
    "workStyle": "Description of work environment",
    "signals": [
      { "signal": "Culture keyword", "evidence": "Where this was found", "implication": "What it means for employees" }
    ]
  },
  "techStack": ["Technologies used by the company"],
  "size": "Estimated or stated company size",
  "stage": "Startup|Growth|Enterprise|Public",
  "founded": "Year if found",
  "headquarters": "Location",
  "recentNews": ["Recent announcements or milestones"],
  "leadership": [
    { "name": "Leader name", "title": "Their title" }
  ],
  "glassdoorSummary": "Any employee review signals detected",
  "competitivePosition": "Where they sit in their market"
}

${ANTI_GENERIC}
${JSON_RULES}`;

// ─── Intelligence Report Generation ─────────────────────────────────

export const INTELLIGENCE_REPORT_PROMPT = (
  userProfile: string,
  jobData: string,
  companyData: string
): string => `# ROLE
You are an Elite Interview Intelligence Analyst. Generate a comprehensive
interview preparation report by cross-referencing the candidate's profile
with the job requirements and company intelligence.

# INPUTS
- CANDIDATE_PROFILE: ${userProfile}
- JOB_DATA: ${jobData}
- COMPANY_INTELLIGENCE: ${companyData}

${INDUSTRY_ROUTING}

# REPORT STRUCTURE
Generate all 7 sections with deep, specific analysis.

# OUTPUT (STRICT JSON)
{
  "companyIntelligence": {
    "overview": "3-4 sentence company deep dive",
    "culture": "Culture analysis with specific signals",
    "recentDevelopments": ["Notable recent events or changes"],
    "techEnvironment": "Technology landscape and tools",
    "size": "Company size and growth trajectory",
    "whatTheyValueMost": "The #1 thing this company looks for based on evidence"
  },
  "roleAnalysis": {
    "summary": "What this person will actually do day-to-day",
    "mustHaveSkills": [
      { "skill": "Skill name", "importance": "Critical|High|Medium", "candidateHas": true }
    ],
    "niceToHaveSkills": [
      { "skill": "Skill name", "candidateHas": true }
    ],
    "seniorityExpectation": "What level of autonomy and leadership is expected",
    "growthPath": "Where this role leads in 1-2 years"
  },
  "prepStrategy": {
    "positioning": "1-2 sentences: how the candidate should position themselves",
    "relevantExperience": [
      { "experience": "Specific CV experience", "mapsTo": "Specific job requirement", "talkingPoint": "How to frame it" }
    ],
    "gapsToAddress": [
      { "gap": "Missing skill or experience", "mitigation": "How to handle this in the interview" }
    ],
    "storyBank": [
      { "theme": "Achievement type", "story": "Brief STAR outline from candidate's background", "bestFor": "Which interview question this answers" }
    ]
  },
  "expectedQuestions": [
    {
      "question": "Realistic interview question specific to THIS role",
      "category": "Technical|Behavioral|Situational|Role-Specific",
      "difficulty": "Easy|Medium|Hard",
      "suggestedAngle": "How to approach this based on candidate's experience",
      "keyPointsToHit": ["Specific things to mention in the answer"]
    }
  ],
  "talkingPoints": [
    {
      "point": "Key talking point (max 10 words)",
      "context": "When to bring this up in the conversation",
      "evidence": "The CV experience that supports this",
      "impact": "Why this matters to the interviewer"
    }
  ],
  "redFlags": [
    {
      "flag": "Potential concern about the role or company",
      "evidence": "What triggered this red flag",
      "questionToAsk": "A diplomatic question to investigate this",
      "dealBreakerLevel": "High|Medium|Low"
    }
  ],
  "salaryIntelligence": {
    "estimatedRange": { "low": "amount", "mid": "amount", "high": "amount", "currency": "symbol" },
    "confidence": "High|Medium|Low",
    "factors": ["What drives the estimate up or down"],
    "negotiationLeverage": ["Candidate's leverage points for negotiation"],
    "marketContext": "How this offer compares to the broader market"
  }
}

${ANTI_GENERIC}
${JSON_RULES}`;

// ─── Mock Interview (Phase 8 — kept, updated for Claude) ────────────

export const MOCK_START_SESSION_PROMPT = (
  jobDescription: string,
  roundType: 'Screening' | 'Technical' | 'Behavioral' | 'Final',
  requiredSkills: string[],
  companyInfo: string,
  cvContent: string,
  difficulty: 'Easy' | 'Medium' | 'Hard'
): string => `# ROLE
You are an experienced Hiring Manager conducting a realistic
${roundType} interview for this specific role. Stay in character throughout.

# CONTEXT
- JOB_DESCRIPTION: ${jobDescription}
- ROUND_TYPE: ${roundType}
- REQUIRED_SKILLS: ${requiredSkills.join(', ')}
- COMPANY: ${companyInfo}
- CANDIDATE_CV: ${cvContent}
- DIFFICULTY: ${difficulty}

# INTERVIEW DESIGN
1. Create a realistic interview flow of 5-7 questions for a ${roundType} round.
2. Questions MUST be derived from the actual job description and required skills.
3. Include at least 1 follow-up question that probes deeper based on expected answers.
4. Difficulty ${difficulty}: Easy = straightforward, Medium = requires depth, Hard = tricky scenarios.
5. Plan natural transitions between questions.

# OUTPUT (STRICT JSON)
{
  "interviewPlan": {
    "openingStatement": "How the interviewer would naturally start the conversation",
    "questions": [
      {
        "id": 1,
        "question": "The interview question",
        "type": "Technical|Behavioral|Situational|Role-Specific",
        "evaluates": "What competency this assesses",
        "followUp": "A probing follow-up if the answer is vague",
        "idealAnswerSignals": ["What a strong answer would include"]
      }
    ],
    "closingPrompt": "Natural closing: 'Do you have any questions for me?'"
  },
  "firstQuestion": "The opening statement + first question"
}

${JSON_RULES}`;

export const MOCK_EVALUATE_ANSWER_PROMPT = (
  question: string,
  userAnswer: string,
  idealSignals: string[],
  questionType: string
): string => `# ROLE
You are evaluating an interview answer as a Hiring Manager.

# INPUTS
- QUESTION: ${question}
- CANDIDATE_ANSWER: ${userAnswer}
- IDEAL_SIGNALS: ${idealSignals.join('; ')}
- QUESTION_TYPE: ${questionType}

# SCORING (1-5 each)
1. Relevance: Did they answer the actual question?
2. Specificity: Concrete examples with details?
3. Structure: STAR/logical flow?
4. Impact: Quantifiable results?

# OUTPUT (STRICT JSON)
{
  "scores": { "relevance": 0, "specificity": 0, "structure": 0, "impact": 0, "overall": 0 },
  "signalsCovered": ["Which ideal signals were addressed"],
  "signalsMissed": ["Which ideal signals were not addressed"],
  "strengthMoment": "The strongest part of the answer",
  "improvementArea": "The #1 thing that would make this answer stronger",
  "nextQuestion": "The follow-up or next question to ask"
}

${JSON_RULES}`;

export const MOCK_SESSION_DEBRIEF_PROMPT = (
  allQuestions: string,
  allAnswers: string,
  allEvaluations: string,
  roundType: string,
  jobDescription: string
): string => `# ROLE
You are now switching from Interviewer to Coach. Provide a comprehensive debrief.

# INPUTS
- ALL_QUESTIONS_AND_ANSWERS: ${allQuestions}
- EVALUATION_DATA: ${allEvaluations}
- ROUND_TYPE: ${roundType}
- JOB_DESCRIPTION: ${jobDescription}

# OUTPUT (STRICT JSON)
{
  "overallScore": 0,
  "grade": "A+|A|B+|B|C+|C|D|F",
  "hiringDecision": "Strong Hire|Hire|Lean Hire|Lean No Hire|No Hire",
  "summary": "2-3 sentence executive summary of performance",
  "categoryScores": { "technical": 0, "behavioral": 0, "communication": 0, "roleKnowledge": 0 },
  "topStrengths": [
    { "strength": "What they did well", "evidence": "Specific quote from their answers" }
  ],
  "topImprovements": [
    { "area": "What to improve", "howToFix": "Specific advice", "practiceExercise": "Concrete exercise" }
  ],
  "answerByAnswerFeedback": [
    {
      "questionNumber": 1,
      "score": 0,
      "verdict": "Strong|Good|Needs Work|Weak",
      "feedback": "Specific feedback",
      "rewriteSuggestion": "How to restructure this answer"
    }
  ],
  "nextSessionFocus": "The #1 area to focus on in the next mock session"
}

${ANTI_GENERIC}
${JSON_RULES}`;
