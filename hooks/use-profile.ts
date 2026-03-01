'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { UserProfileSettings } from '@/types/user';

export type ProfileResponse = {
  success: boolean;
  profile: {
    settings: UserProfileSettings;
    aiUsage?: { used?: number; limit?: number; resetsAt?: string };
  };
};

const PROFILE_KEY = ['profile'] as const;

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      const res = await apiClient.get<ProfileResponse>('/api/profile');
      return res.success ? res.profile : null;
    },
  });
}

export function useUpdateProfileSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: UserProfileSettings) => {
      return apiClient.post<{ success: boolean }>('/api/profile', {
        action: 'update-settings',
        settings,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}
