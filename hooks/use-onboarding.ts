import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CvExtracted, OnboardingQuestion, OnboardingAnswer } from '@/types/onboarding';

type OnboardingStatus = {
  success: boolean;
  hasCv: boolean;
  onboardingCompleted: boolean;
  cvExtracted: CvExtracted | null;
  onboardingQa: OnboardingAnswer[] | null;
};

type UploadCvResponse = {
  success: boolean;
  extracted: CvExtracted;
};

type QuestionsResponse = {
  success: boolean;
  questions: OnboardingQuestion[];
};

export const useOnboardingStatus = () =>
  useQuery<OnboardingStatus>({
    queryKey: ['onboarding-status'],
    queryFn: () => apiClient.get<OnboardingStatus>('/api/onboarding/status'),
    staleTime: 30_000,
  });

export const useUploadCv = () => {
  const qc = useQueryClient();

  return useMutation<UploadCvResponse, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/onboarding/upload-cv', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data as UploadCvResponse;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
  });
};

export const useGenerateQuestions = () =>
  useMutation<QuestionsResponse, Error>({
    mutationFn: () => apiClient.post<QuestionsResponse>('/api/onboarding/questions'),
  });

export const useCompleteOnboarding = () => {
  const qc = useQueryClient();

  return useMutation<{ success: boolean }, Error, OnboardingAnswer[]>({
    mutationFn: (answers: OnboardingAnswer[]) =>
      apiClient.post<{ success: boolean }>('/api/onboarding/complete', { answers }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
  });
};
