'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Application,
  ApplicationFilters,
  ApplicationListResponse,
  CreateApplicationInput,
  UpdateStatusInput,
} from '@/types/application';

const APPLICATIONS_KEY = ['applications'] as const;
const APPLICATION_KEY = (id: string | number) => ['application', id] as const;
const STATS_KEY = ['stats'] as const;
const COMPANIES_KEY = ['companies'] as const;

const DEFAULT_PAGE_SIZE = 20;

/** Filters for list/infinite query (no offset — that comes from pageParam). */
type BaseFilters = Omit<ApplicationFilters, 'offset'>;

function buildFilterParams(filters: ApplicationFilters): Record<string, string | number | undefined> {
  const params: Record<string, string | number | undefined> = {
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
    sort_by: filters.sortBy,
  };
  if (filters.status) params.status = filters.status;
  if (filters.company) params.company = filters.company;
  if (filters.work_mode) params.work_mode = filters.work_mode;
  return params;
}

export function useApplications(filters: ApplicationFilters) {
  return useQuery({
    queryKey: [...APPLICATIONS_KEY, filters],
    queryFn: async (): Promise<Application[]> => {
      if (filters.search?.trim()) {
        const res = await apiClient.get<{ applications: Application[] }>('/api/search', {
          params: { q: filters.search, limit: filters.limit ?? 50, offset: filters.offset ?? 0 },
        });
        return res.applications ?? [];
      }
      const res = await apiClient.get<ApplicationListResponse>('/api/filter', {
        params: buildFilterParams(filters),
      });
      return res.applications ?? [];
    },
    enabled: true,
  });
}

/** Infinite list for dashboard/kanban with Load More. */
export function useInfiniteApplications(baseFilters: BaseFilters, pageSize = DEFAULT_PAGE_SIZE) {
  return useInfiniteQuery({
    queryKey: [...APPLICATIONS_KEY, 'infinite', { ...baseFilters, pageSize }],
    queryFn: async ({ pageParam = 0 }): Promise<Application[]> => {
      const filters: ApplicationFilters = { ...baseFilters, limit: pageSize, offset: pageParam };
      if (filters.search?.trim()) {
        const res = await apiClient.get<{ applications: Application[] }>('/api/search', {
          params: { q: filters.search, limit: pageSize, offset: pageParam },
        });
        return res.applications ?? [];
      }
      const res = await apiClient.get<ApplicationListResponse>('/api/filter', {
        params: buildFilterParams(filters),
      });
      return res.applications ?? [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages) =>
      lastPage.length === pageSize ? _allPages.length * pageSize : undefined,
  });
}

/** Update application details (status, notes, interview_stages, etc.). API: POST /api/update-details { id, updates }. */
export function useUpdateDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string | number;
      updates: Record<string, unknown>;
    }) => {
      return apiClient.post<{ success: boolean; application?: Application }>('/api/update-details', {
        id: Number(id),
        updates,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_KEY });
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEY(variables.id) });
    },
  });
}

/** No GET-by-id API yet; detail comes from list cache or server page. Use this to select from list. */
export function useApplicationFromList(
  id: string | number | null,
  applications: Application[] | undefined
): { data: Application | undefined; isLoading: boolean } {
  const app = id != null && applications ? applications.find((a) => String(a.id) === String(id)) : undefined;
  return { data: app, isLoading: false };
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateApplicationInput) => {
      const body = {
        jobTitle: input.jobTitle,
        company: input.company,
        jobUrl: input.jobUrl,
        applicationDate: input.applicationDate,
        location: input.location,
        workMode: input.workMode,
        salary: input.salary,
        companyUrl: input.companyUrl,
        status: input.status ?? 'Applied',
        keyResponsibilities: input.keyResponsibilities,
        requiredSkills: input.requiredSkills,
        companyDescription: input.companyDescription,
        originalContent: input.originalContent,
        formattedContent: input.formattedContent,
        negativeSignals: input.negativeSignals,
        roleSummary: input.roleSummary,
        interviewStages: input.interviewStages,
        hiringManager: input.hiringManager,
        companyInfo: input.companyInfo,
        interviewPrepNotes: input.interviewPrepNotes,
        metadata: input.metadata,
      };
      return apiClient.post<{ success: boolean; id: string | number }>('/api/save', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_KEY });
      queryClient.invalidateQueries({ queryKey: COMPANIES_KEY });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateStatusInput) => {
      return apiClient.post<{ success: boolean }>('/api/update-status', input);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_KEY });
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEY(variables.id) });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      return apiClient.delete<{ success: boolean }>(`/api/delete/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_KEY });
      queryClient.invalidateQueries({ queryKey: COMPANIES_KEY });
    },
  });
}
