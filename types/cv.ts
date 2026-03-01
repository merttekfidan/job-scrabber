export type CvData = {
  id: string | number;
  user_id: string;
  filename: string;
  raw_text: string;
  ai_analysis: CvAnalysis | string;
  is_active: boolean;
  uploaded_at: string;
};

export type CvAnalysis = {
  summary?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  [key: string]: unknown;
};

export type SwotAnalysis = {
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  [key: string]: unknown;
};

export type PersonalizedPrep = {
  talkingPoints?: string[];
  questionsToAsk?: string[];
  redFlags?: string[];
  [key: string]: unknown;
};
