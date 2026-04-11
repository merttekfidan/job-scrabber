export type ApplicationStatus =
  | 'Applied'
  | 'Screening'
  | 'Interview'
  | 'Offer'
  | 'Decided'
  | 'Rejected'
  | 'Withdrawn';

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
  source_url: string | null;
  notes: string | null;
  interview_date: string | null;
  job_data: JobData | null;
  company_data: CompanyData | null;
  created_at?: string;
  updated_at?: string;
};

export type JobData = {
  jobTitle?: string;
  company?: string;
  location?: string;
  workMode?: string;
  salary?: string;
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
  responsibilities?: string[];
  benefits?: string[];
  teamInfo?: string;
  techStack?: string[];
  seniorityLevel?: string;
  companyDescription?: string;
  companySize?: string;
  industry?: string;
  applicationDeadline?: string;
  roleSummary?: string;
};

export type CompanyData = {
  overview?: string;
  product?: string;
  culture?: {
    values?: string[];
    workStyle?: string;
    signals?: Array<{ signal: string; evidence: string; implication: string }>;
  };
  techStack?: string[];
  size?: string;
  stage?: string;
  founded?: string;
  headquarters?: string;
  recentNews?: string[];
  leadership?: Array<{ name: string; title: string }>;
  glassdoorSummary?: string;
  competitivePosition?: string;
};

export type ApplicationFilters = {
  status?: string;
  company?: string;
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
  jobUrl?: string | null;
  applicationDate?: string | null;
  location?: string | null;
  workMode?: string | null;
  salary?: string | null;
  companyUrl?: string | null;
  status?: string;
  sourceUrl?: string | null;
  notes?: string | null;
  interviewDate?: string | null;
  jobData?: JobData;
  companyData?: CompanyData;
};

export type UpdateApplicationInput = Partial<CreateApplicationInput> & { id: number };

export type UpdateStatusInput = { id: number; status: string };
