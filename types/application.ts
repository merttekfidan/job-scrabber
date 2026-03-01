export type ApplicationStatus =
  | 'Applied'
  | 'Interview Scheduled'
  | 'Offer Received'
  | 'Rejected'
  | 'Withdrawn';

export type InterviewStage = {
  name?: string;
  date?: string;
  type?: string;
  notes?: string;
  [key: string]: unknown;
};

export type InterviewPrepNotes = {
  keyTalkingPoints?: unknown[];
  questionsToAsk?: unknown[];
  potentialRedFlags?: unknown[];
  redFlags?: unknown[];
  likelyInterviewQuestions?: unknown[];
  techStackToStudy?: unknown[];
};

/** Application record as returned by API (snake_case from DB) */
export type Application = {
  id: string | number;
  user_id: string;
  job_title: string;
  company: string;
  location: string | null;
  work_mode: string | null;
  salary: string | null;
  application_date: string;
  job_url: string | null;
  company_url: string | null;
  status: string;
  key_responsibilities: string[] | string;
  required_skills: string[] | string;
  preferred_skills: string[] | string;
  company_description: string | null;
  interview_prep_key_talking_points?: unknown;
  interview_prep_questions_to_ask?: unknown;
  interview_prep_potential_red_flags?: unknown;
  interview_prep_notes?: Record<string, unknown> | string | null;
  source?: string | null;
  original_content: string | null;
  interview_stages: InterviewStage[] | string;
  role_summary: string | null;
  formatted_content: string | null;
  negative_signals: string[] | string;
  personalized_analysis?: Record<string, unknown> | string | null;
  hiring_manager?: Record<string, unknown> | string | null;
  company_info?: Record<string, unknown> | string | null;
  created_at?: string;
  updated_at?: string;
};

export type ApplicationFilters = {
  status?: string;
  company?: string;
  work_mode?: string;
  search?: string;
  sortBy?: 'date_desc' | 'date_asc' | 'company_asc' | 'company_desc';
  limit?: number;
  offset?: number;
};

export type ApplicationListResponse = {
  success: boolean;
  count?: number;
  applications: Application[];
};

export type CreateApplicationInput = {
  jobTitle: string;
  company: string;
  jobUrl: string;
  applicationDate: string;
  location?: string | null;
  workMode?: string | null;
  salary?: string | null;
  companyUrl?: string | null;
  status?: string;
  keyResponsibilities?: string[];
  requiredSkills?: string[];
  preferredSkills?: string[];
  companyDescription?: string | null;
  originalContent?: string | null;
  formattedContent?: string | null;
  negativeSignals?: string[];
  roleSummary?: string | null;
  interviewStages?: InterviewStage[];
  hiringManager?: Record<string, unknown> | null;
  companyInfo?: Record<string, unknown> | null;
  interviewPrepNotes?: InterviewPrepNotes;
  metadata?: Record<string, unknown>;
};

export type UpdateApplicationInput = Partial<CreateApplicationInput> & { id: number };

export type UpdateStatusInput = { id: number; status: string };
