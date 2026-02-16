# Groq API Prompt Template

This document describes the prompt structure used to process job application data with Groq AI (llama-3.3-70b-versatile).

## Prompt Design Philosophy

The prompt is designed to:
1. **Extract ALL data** from raw page content (no manual parsing)
2. **Generate actionable interview preparation notes** tailored to each role
3. **Return valid JSON** that can be directly parsed and stored
4. **Handle any job board** without custom extractors

## Full Prompt Template

```
You are an expert job application assistant. Extract and structure job posting information from the provided page content.

INPUT DATA:
- Page URL: {url}
- Page Title: {pageTitle}
- Job Board: {jobBoard}
- Raw Page Content: {pageContent}

TASK:
Analyze the page content and extract ALL relevant job information. Parse the raw text to identify:
- Job title
- Company name
- Location and work mode (remote/hybrid/onsite)
- Salary range (if mentioned)
- Key responsibilities
- Required and preferred skills
- Company description
- Any other relevant details

OUTPUT REQUIREMENTS:
Return ONLY valid JSON with this exact structure (no markdown, no code blocks, just raw JSON):
{
  "jobTitle": "string",
  "company": "string",
  "location": "string",
  "workMode": "remote|hybrid|onsite|unknown",
  "salary": "string or null",
  "applicationDate": "{ISO date string}",
  "jobUrl": "{url}",
  "companyUrl": "string or null (extract from content if available)",
  "status": "Applied",
  "keyResponsibilities": ["array of 3-5 main responsibilities extracted from job description"],
  "requiredSkills": ["array of key required skills"],
  "preferredSkills": ["array of preferred/nice-to-have skills"],
  "companyDescription": "brief 1-2 sentence company overview (extract from content)",
  "interviewPrepNotes": {
    "keyTalkingPoints": ["3-5 key points to emphasize based on job requirements"],
    "questionsToAsk": ["3-5 thoughtful questions to ask the interviewer"],
    "potentialRedFlags": ["any concerns or red flags noticed in the posting"]
  },
  "metadata": {
    "jobBoardSource": "{jobBoard}",
    "extractedAt": "{ISO date string}"
  }
}

IMPORTANT INSTRUCTIONS:
- Parse the raw page content carefully to extract all information
- Infer work mode from location text (e.g., "Remote" = remote, specific city = onsite, "Hybrid" = hybrid)
- Extract salary if mentioned anywhere in the content
- Be specific and actionable in interview prep notes
- If information is not found in the content, use null or empty arrays
- Return ONLY the JSON object, no other text, no markdown formatting
- Make sure the JSON is valid and parseable
```

## Expected JSON Schema

```json
{
  "jobTitle": "Senior Full Stack Developer",
  "company": "TechCorp Inc.",
  "location": "San Francisco, CA",
  "workMode": "hybrid",
  "salary": "$150,000 - $180,000",
  "applicationDate": "2026-02-16T03:35:00.000Z",
  "jobUrl": "https://example.com/jobs/12345",
  "companyUrl": "https://techcorp.com",
  "status": "Applied",
  "keyResponsibilities": [
    "Design and develop scalable web applications",
    "Lead technical architecture decisions",
    "Mentor junior developers",
    "Collaborate with product team on feature planning"
  ],
  "requiredSkills": [
    "JavaScript/TypeScript",
    "React",
    "Node.js",
    "PostgreSQL",
    "AWS"
  ],
  "preferredSkills": [
    "Next.js",
    "GraphQL",
    "Docker",
    "CI/CD experience"
  ],
  "companyDescription": "TechCorp is a fast-growing SaaS company providing enterprise solutions for team collaboration and project management.",
  "interviewPrepNotes": {
    "keyTalkingPoints": [
      "Highlight experience with React and Node.js full-stack development",
      "Emphasize leadership and mentoring experience",
      "Discuss scalability challenges you've solved",
      "Mention AWS cloud architecture experience"
    ],
    "questionsToAsk": [
      "What are the biggest technical challenges the team is currently facing?",
      "How does the team balance feature development with technical debt?",
      "What does success look like for this role in the first 6 months?",
      "What opportunities are there for professional growth?",
      "How does the company support work-life balance?"
    ],
    "potentialRedFlags": [
      "No mention of team size or structure",
      "Salary range seems below market rate for SF"
    ]
  },
  "metadata": {
    "jobBoardSource": "LinkedIn",
    "extractedAt": "2026-02-16T03:35:00.000Z"
  }
}
```

## Key Features

### 1. Full LLM Parsing
- No manual extraction - LLM parses everything from raw content
- Works with any job board without custom code
- More reliable than CSS selectors that break

### 2. Smart Inference
- Work mode from location text
- Company info from context
- Salary from anywhere in content

### 3. Interview Prep Notes
The most valuable part:
- **Key Talking Points**: What to emphasize
- **Questions to Ask**: Thoughtful, role-specific questions
- **Red Flags**: Concerns to address or watch for

### 4. Graceful Degradation
If information is missing:
- Strings → `null`
- Arrays → `[]`
- Still returns valid JSON

## API Configuration

### Groq Model
- **Model**: `llama-3.3-70b-versatile`
- **Temperature**: 0.2 (low for consistent, factual output)
- **Max Tokens**: 2048
- **Top P**: 0.95

### Why These Settings?
- **Low temperature** ensures consistent JSON structure
- **Sufficient tokens** for detailed interview prep notes
- **llama-3.3-70b** is fast and excellent at structured extraction

## Error Handling

The background script handles:
1. **Invalid JSON**: Strips markdown code blocks before parsing
2. **Missing fields**: Validates required fields
3. **API errors**: Returns user-friendly error messages
4. **Rate limits**: Caught and reported to user

## Advantages Over Manual Parsing

1. **No maintenance**: CSS selectors don't break when sites change
2. **Universal**: Works on any job board
3. **Smarter**: LLM understands context better than regex
4. **Richer data**: Generates interview prep automatically
