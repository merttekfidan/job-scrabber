'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type CompanyRow = { company: string; count: string };

export type CompaniesResponse = {
  success: boolean;
  count?: number;
  companies: CompanyRow[];
};

const COMPANIES_KEY = ['companies'] as const;

export function useCompanies() {
  return useQuery({
    queryKey: COMPANIES_KEY,
    queryFn: async () => {
      const res = await apiClient.get<CompaniesResponse>('/api/companies');
      return res.companies ?? [];
    },
  });
}
