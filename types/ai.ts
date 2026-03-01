export type CompanyInsights = {
  strategicFocus?: string;
  salaryIntel?: string;
  culture?: string;
  [key: string]: unknown;
};

export type HiringFramework = {
  competencies?: string[];
  questions?: string[];
  [key: string]: unknown;
};

export type AIProvider = {
  id: string;
  name: string;
  [key: string]: unknown;
};

export type AIProviderConfig = {
  apiKey?: string;
  model?: string;
  [key: string]: unknown;
};
