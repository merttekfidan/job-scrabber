'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { MockSession, MockSessionDebrief, MockInterviewPlan, MockAnswerEvaluation, StartMockInput, SubmitAnswerInput } from '@/types/mock';

const MOCK_KEY = ['mock'] as const;

type StartResponse = {
  success: boolean;
  sessionId: number;
  firstQuestion: string;
  totalQuestions: number;
  interviewPlan: MockInterviewPlan;
};

type SubmitResponse = {
  success: boolean;
  evaluation: MockAnswerEvaluation;
  nextQuestion: string;
  isLastQuestion: boolean;
  questionsAnswered: number;
  totalQuestions: number;
};

type EndResponse = {
  success: boolean;
  debrief: MockSessionDebrief;
  sessionId: number;
};

type HistoryResponse = {
  success: boolean;
  sessions: MockSession[];
};

export function useMockHistory(applicationId?: number) {
  return useQuery({
    queryKey: [...MOCK_KEY, 'history', applicationId],
    queryFn: async (): Promise<MockSession[]> => {
      const url = applicationId ? `/api/mock?applicationId=${applicationId}` : '/api/mock';
      const res = await apiClient.get<HistoryResponse>(url);
      return res.sessions ?? [];
    },
  });
}

export function useStartMockSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StartMockInput) => {
      return apiClient.post<StartResponse>('/api/ai/mock/start', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOCK_KEY });
    },
  });
}

export function useSubmitMockAnswer() {
  return useMutation({
    mutationFn: async (input: SubmitAnswerInput) => {
      return apiClient.post<SubmitResponse>('/api/ai/mock/submit', input);
    },
  });
}

export function useEndMockSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: number) => {
      return apiClient.post<EndResponse>('/api/ai/mock/end', { sessionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOCK_KEY });
    },
  });
}
