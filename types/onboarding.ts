export type CvExtracted = {
  summary: string;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    duration: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  certifications: string[];
  experienceLevel: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
  keyAchievements: string[];
  industries: string[];
};

export type OnboardingQuestion = {
  id: string;
  question: string;
  purpose: string;
  inputType: 'text' | 'select';
  options?: string[];
};

export type OnboardingAnswer = {
  questionId: string;
  question: string;
  answer: string;
};

export type UserProfile = {
  user_id: string;
  cv_raw_text: string | null;
  cv_extracted: CvExtracted | null;
  onboarding_qa: OnboardingAnswer[] | null;
  onboarding_completed: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
