'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type StatsResponse = {
  success: boolean;
  stats: {
    total: number;
  };
  user?: { email?: string; name?: string };
};

const STATS_KEY = ['stats'] as const;

export function useStats() {
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: () => apiClient.get<StatsResponse>('/api/stats'),
    select: (data) => (data.success ? data.stats : null),
  });
}
