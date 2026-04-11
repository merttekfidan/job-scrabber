export type ReportSection<T = unknown> = T;

export type CompanyIntelligenceSection = {
  overview: string;
  culture: string;
  recentDevelopments: string[];
  techEnvironment: string;
  size: string;
  whatTheyValueMost: string;
};

export type SkillAssessment = {
  skill: string;
  importance?: 'Critical' | 'High' | 'Medium';
  candidateHas: boolean;
};

export type RoleAnalysisSection = {
  summary: string;
  mustHaveSkills: SkillAssessment[];
  niceToHaveSkills: SkillAssessment[];
  seniorityExpectation: string;
  growthPath: string;
};

export type PrepStrategySection = {
  positioning: string;
  relevantExperience: Array<{
    experience: string;
    mapsTo: string;
    talkingPoint: string;
  }>;
  gapsToAddress: Array<{
    gap: string;
    mitigation: string;
  }>;
  storyBank: Array<{
    theme: string;
    story: string;
    bestFor: string;
  }>;
};

export type ExpectedQuestion = {
  question: string;
  category: 'Technical' | 'Behavioral' | 'Situational' | 'Role-Specific';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  suggestedAngle: string;
  keyPointsToHit: string[];
};

export type TalkingPoint = {
  point: string;
  context: string;
  evidence: string;
  impact: string;
};

export type RedFlag = {
  flag: string;
  evidence: string;
  questionToAsk: string;
  dealBreakerLevel: 'High' | 'Medium' | 'Low';
};

export type SalaryIntelligenceSection = {
  estimatedRange: { low: string; mid: string; high: string; currency: string };
  confidence: 'High' | 'Medium' | 'Low';
  factors: string[];
  negotiationLeverage: string[];
  marketContext: string;
};

export type IntelligenceReportData = {
  companyIntelligence: CompanyIntelligenceSection;
  roleAnalysis: RoleAnalysisSection;
  prepStrategy: PrepStrategySection;
  expectedQuestions: ExpectedQuestion[];
  talkingPoints: TalkingPoint[];
  redFlags: RedFlag[];
  salaryIntelligence: SalaryIntelligenceSection;
};

export type IntelligenceReport = {
  id: number;
  user_id: string;
  application_id: number;
  report_data: IntelligenceReportData;
  pdf_url: string | null;
  generated_at: string;
  version: number;
};
