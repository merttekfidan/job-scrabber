'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateDetails } from '@/hooks';
import { safeParseJson } from '@/lib/utils';
import { ApplicationHeader } from '@/components/dashboard/ApplicationHeader';
import { InterviewTimeline } from '@/components/dashboard/InterviewTimeline';
import { NotesEditor } from '@/components/dashboard/NotesEditor';
import { CompanyInsightsPanel } from '@/components/dashboard/CompanyInsightsPanel';
import { SwotAnalysis, type SwotData } from '@/components/dashboard/SwotAnalysis';
import { JobDescription } from '@/components/dashboard/JobDescription';
import { TechStackPanel } from '@/components/dashboard/TechStackPanel';
import { SkillsPanel } from '@/components/dashboard/SkillsPanel';
import { RedFlagsPanel } from '@/components/dashboard/RedFlagsPanel';
import type { Application } from '@/types/application';

type PrepNotes = { generalNotes?: string; techStackToStudy?: string[]; [key: string]: unknown };
type CompanyInfo = { industry?: string; size?: string; fundingStage?: string } | null;
type HiringManager = { name?: string; title?: string; linkedinUrl?: string } | null;

type ApplicationDetailClientProps = {
  initialApp: Application;
  isShared?: boolean;
};

export default function ApplicationDetailClient({
  initialApp,
  isShared = false,
}: ApplicationDetailClientProps) {
  const [app, setApp] = useState<Application>(initialApp);
  const updateDetailsMutation = useUpdateDetails();

  const handleUpdateDetails = useCallback(
    async (updates: Record<string, unknown>) => {
      if (isShared) return;
      try {
        const data = await updateDetailsMutation.mutateAsync({
          id: app.id,
          updates,
        });
        if (data?.application) {
          setApp(data.application as Application);
        } else {
          setApp((prev) => ({ ...prev, ...updates } as Application));
        }
        toast.success('Updated successfully');
      } catch {
        toast.error('Failed to update');
      }
    },
    [app.id, isShared, updateDetailsMutation]
  );

  const insights = (app.personalized_analysis as Record<string, unknown> | undefined)?.companyInsights ?? null;
  const swot = ((app.personalized_analysis as Record<string, unknown> | undefined)?.swot ??
    null) as SwotData | null;
  const prep: PrepNotes =
    typeof app.interview_prep_notes === 'string'
      ? safeParseJson<PrepNotes>(app.interview_prep_notes, {})
      : (app.interview_prep_notes as PrepNotes) ?? {};
  const hiringManager: HiringManager =
    typeof app.hiring_manager === 'string'
      ? safeParseJson<HiringManager>(app.hiring_manager, null)
      : (app.hiring_manager as HiringManager) ?? null;
  const companyInfo: CompanyInfo =
    typeof app.company_info === 'string'
      ? safeParseJson<CompanyInfo>(app.company_info, null)
      : (app.company_info as CompanyInfo) ?? null;

  const isSaving = updateDetailsMutation.isPending;

  return (
    <div id="main" role="main" className="relative min-h-screen bg-[#0f1117] pb-20 font-sans text-gray-300 selection:bg-blue-500/30">
      <div className="sticky top-0 z-40 border-b border-gray-800 bg-[#0f1117]/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {!isShared ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
              >
                <ArrowLeft size={18} /> Back to Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2 font-bold tracking-tight text-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-base text-white">
                  JS
                </div>
                HuntIQ{' '}
                <span className="ml-2 border-l border-gray-700 pl-3 text-base font-normal text-gray-500">
                  Mentorship View
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <ApplicationHeader
          app={app}
          companyInfo={companyInfo}
          isShared={isShared}
          isSaving={isSaving}
          onUpdateDetails={handleUpdateDetails}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {hiringManager?.name &&
              hiringManager.name !== 'If mentioned or visible on the page' && (
                <div className="flex items-center justify-between rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20">
                      <Briefcase size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{hiringManager.name}</h3>
                      <p className="text-base text-blue-300">
                        {hiringManager.title || 'Hiring Manager'}
                      </p>
                    </div>
                  </div>
                  {hiringManager.linkedinUrl &&
                    hiringManager.linkedinUrl !== 'If available' && (
                      <a
                        href={hiringManager.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-blue-600/20 px-4 py-2 text-base font-medium text-blue-300 transition-colors hover:bg-blue-600/40"
                      >
                        LinkedIn
                      </a>
                    )}
                </div>
              )}

            <InterviewTimeline
              app={app}
              setApp={setApp}
              onUpdateDetails={handleUpdateDetails}
              isShared={isShared}
              isSaving={isSaving}
            />

            <NotesEditor
              app={app}
              setApp={setApp}
              onUpdateDetails={handleUpdateDetails}
              isShared={isShared}
              prep={prep}
            />

            <CompanyInsightsPanel insights={insights} />
            <SwotAnalysis swot={swot} />

            <JobDescription
              content={
                app.formatted_content ||
                app.original_content ||
                app.company_description ||
                ''
              }
            />
          </div>

          <div className="space-y-6">
            <TechStackPanel
              techStack={Array.isArray(prep.techStackToStudy) ? prep.techStackToStudy : []}
            />
            <SkillsPanel
              requiredSkills={app.required_skills}
              preferredSkills={app.preferred_skills}
            />
            <RedFlagsPanel negativeSignals={app.negative_signals} />
          </div>
        </div>
      </div>
    </div>
  );
}
