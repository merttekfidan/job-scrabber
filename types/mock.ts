export type MockDifficulty = 'Easy' | 'Medium' | 'Hard';
export type MockRoundType = 'Screening' | 'Technical' | 'Behavioral' | 'Final';

export type MockQuestion = {
  id: number;
  question: string;
  type: string;
  evaluates: string;
  followUp: string;
  idealAnswerSignals: string[];
};

export type MockSession = {
  id: number;
  user_id: string;
  application_id: number;
  round_type: MockRoundType;
  difficulty: MockDifficulty;
  interview_plan: Record<string, unknown>;
  questions_and_answers: Record<string, unknown>[];
  overall_score: number | null;
  grade: string | null;
  hiring_decision: string | null;
  category_scores: Record<string, number>;
  debrief: Record<string, unknown>;
  status: 'in_progress' | 'completed';
  questions_answered: number;
  total_questions: number;
  duration_seconds: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};
