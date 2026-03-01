'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CompanyInsights } from '@/types/ai';

type CompanyInsightsResponse = { success: boolean; insights?: CompanyInsights; error?: string };
type HiringFrameworksResponse = { success: boolean; framework?: unknown; error?: string };

/** Generate company insights for an application. Call mutate(applicationId). */
export function useCompanyInsights(_appId?: string | number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (applicationId: string | number) => {
      const res = await apiClient.post<CompanyInsightsResponse>('/api/ai/company-insights', {
        applicationId: Number(applicationId),
      });
      if (!res.success) throw new Error((res as { error?: string }).error ?? 'Failed to generate insights');
      return res;
    },
    onSuccess: (_, applicationId) => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

/** Generate a hiring framework (star, whyCompany, salary, plan3060, competency) for an application. */
export function useHiringFrameworks(appId: string | number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (framework: string) => {
      const res = await apiClient.post<HiringFrameworksResponse>('/api/ai/hiring-frameworks', {
        applicationId: Number(appId),
        framework,
      });
      if (!res.success) throw new Error((res as { error?: string }).error ?? 'Failed to generate framework');
      return res;
    },
    onSuccess: () => {
      if (appId != null) {
        queryClient.invalidateQueries({ queryKey: ['application', appId] });
        queryClient.invalidateQueries({ queryKey: ['applications'] });
      }
    },
  });
}
