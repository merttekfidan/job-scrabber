'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type StatsByStatus = { status: string; count: string };
export type TopCompany = { company: string; count: string };

export type StatsResponse = {
  success: boolean;
  stats: {
    total: number;
    byStatus: StatsByStatus[];
    last7Days: number;
    topCompanies: TopCompany[];
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

export type SmartAnalyticsResponse = {
  success: boolean;
  velocity?: { week_start: string; count: string }[];
  responseRate?: { responded: string; total: string };
  avgTimeToResponse?: { avg_days: string };
  skillDemand?: Record<string, number>;
  weeklyDigest?: {
    this_week: string;
    last_week: string;
    interviews_this_week: string;
    offers_this_month: string;
  };
  streak?: number;
  [key: string]: unknown;
};

const SMART_ANALYTICS_KEY = ['smart-analytics'] as const;

export function useSmartAnalytics() {
  return useQuery({
    queryKey: SMART_ANALYTICS_KEY,
    queryFn: () => apiClient.get<SmartAnalyticsResponse>('/api/smart-analytics'),
  });
}
