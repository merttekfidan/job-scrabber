'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CvData } from '@/types/cv';

type UploadResponse = {
  success: boolean;
  message?: string;
  cv?: CvData;
  error?: string;
};

/** Upload CV (FormData); no GET CV endpoint yet. */
export function useUploadCv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(typeof window !== 'undefined' ? '/api/cv/upload' : `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/cv/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = (await res.json()) as UploadResponse;
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Upload failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cv'] });
    },
  });
}

/** Analyze job (SWOT + prep) for an application. Call mutate(applicationId). Invalidates application detail. */
export function useAnalyzeJob(_appId?: string | number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (applicationId: string | number) => {
      const res = await fetch(typeof window !== 'undefined' ? '/api/cv/analyze-job' : `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/cv/analyze-job`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: Number(applicationId) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Analysis failed');
      return data as { success: boolean; analysis: unknown };
    },
    onSuccess: (_, applicationId) => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
