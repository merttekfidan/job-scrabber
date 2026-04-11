'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useInfiniteApplications,
  useStats,
  useCompanies,
  useUpdateDetails,
  useDeleteApplication,
  useAnalyzeJob,
  useCompanyInsights,
} from '@/hooks';
import { safeParseJson } from '@/lib/utils';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import CvUpload from '@/components/CvUpload';
import ErrorBoundary from '@/components/ErrorBoundary';
import UpcomingInterviews from '@/components/dashboard/UpcomingInterviews';
import ProfileModal from '@/components/dashboard/ProfileModal';
import ApplicationFilters from '@/components/dashboard/ApplicationFilters';
import JobDetailView from '@/components/dashboard/JobDetailView';
import KanbanBoard from '@/components/dashboard/KanbanBoard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Application } from '@/types/application';
import type { Session } from 'next-auth';

const LIMIT = 20;

type DashboardClientProps = {
  session: Session | null;
};

const JOB_QUERY_PARAM = 'job';

export default function DashboardClient({ session }: DashboardClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentView = pathname?.includes('/coach') ? 'coach' : 'applications';

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    workMode: '',
    company: '',
    sortBy: 'date_desc' as const,
  });
  const selectedJobId = searchParams.get(JOB_QUERY_PARAM);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    refetch: refetchApplications,
  } = useInfiniteApplications(
    {
      search: filters.search,
      status: filters.status || undefined,
      work_mode: filters.workMode || undefined,
      company: filters.company || undefined,
      sortBy: filters.sortBy,
    },
    LIMIT
  );

  const { data: stats, refetch: refetchStats } = useStats();
  const { data: companies = [] } = useCompanies();
  const updateDetailsMutation = useUpdateDetails();
  const deleteMutation = useDeleteApplication();
  const analyzeJobMutation = useAnalyzeJob();
  const companyInsightsMutation = useCompanyInsights();

  const applications = applicationsData?.pages?.flat() ?? [];

  const selectedApplication = selectedJobId
    ? applications.find((a) => String(a.id) === String(selectedJobId))
    : undefined;

  const handleOpenJob = useCallback(
    (id: string | number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(JOB_QUERY_PARAM, String(id));
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handleBackToList = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  useEffect(() => {
    if (!selectedJobId || applicationsLoading) return;
    const found = applications.some((a) => String(a.id) === String(selectedJobId));
    if (!found && applications.length > 0) {
      router.replace(pathname);
    }
  }, [selectedJobId, applications, applicationsLoading, applications.length, pathname, router]);

  const handleRefresh = useCallback(() => {
    refetchApplications();
    refetchStats();
  }, [refetchApplications, refetchStats]);
  const totalCount = stats?.total ?? 0;

  const handleExportCsv = useCallback(() => {
    if (!applications.length) {
      toast.error('No data to export');
      return;
    }
    const headers = ['Job Title', 'Company', 'Location', 'Status', 'Date', 'URL'];
    const rows = applications.map((a) => [
      a.job_title,
      a.company,
      a.location,
      a.status,
      a.application_date,
      a.job_url,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c ?? ''}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-apps-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported');
  }, [applications]);

  const handleUpdateDetails = useCallback(
    async (id: string | number, updates: Record<string, unknown>) => {
      try {
        await updateDetailsMutation.mutateAsync({ id, updates });
        toast.success('Updated successfully');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update');
      }
    },
    [updateDetailsMutation]
  );

  const handleAnalyzeJob = useCallback(
    async (appId: string | number) => {
      try {
        await analyzeJobMutation.mutateAsync(appId);
        toast.success('AI Analysis completed!');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Analysis failed');
      }
    },
    [analyzeJobMutation]
  );

  const handleGenerateInsights = useCallback(
    async (appId: string | number) => {
      try {
        toast.info('Generating deep insights... this may take a moment.');
        await companyInsightsMutation.mutateAsync(appId);
        toast.success('Company insights generated!');
      } catch (err) {
        toast.error('Failed to generate insights');
      }
    },
    [companyInsightsMutation]
  );

  const handleShare = useCallback((appId: string | number) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${appId}`;
    navigator.clipboard.writeText(url);
    toast.success('Secure share link copied to clipboard!');
  }, []);

  const handleRequestDelete = useCallback((app: Application) => {
    setSelectedApp(app);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedApp) return;
    try {
      await deleteMutation.mutateAsync(selectedApp.id);
      setDeleteModalOpen(false);
      setSelectedApp(null);
      router.push(pathname);
      toast.success('Application deleted');
    } catch {
      toast.error('Failed to delete application');
    }
  }, [selectedApp, deleteMutation, router, pathname]);

  const upcomingInterviews = applications
    .flatMap((app) => {
      const stages = safeParseJson<Array<{ date?: string; appName?: string; appId?: string | number }>>(
        app.interview_stages,
        []
      );
      return stages.map((stage) => ({ ...stage, appName: app.company, appId: app.id }));
    })
    .filter((i) => i.date && new Date(i.date) >= new Date())
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen">
      <DashboardHeader
        session={session}
        currentView={currentView}
        onRefresh={handleRefresh}
        onExportCsv={handleExportCsv}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main id="main" className="main container" role="main">
        {selectedJobId && selectedApplication ? (
          <JobDetailView
            app={selectedApplication}
            onBack={handleBackToList}
            onUpdateDetails={handleUpdateDetails}
            onAnalyzeJob={handleAnalyzeJob}
            onGenerateInsights={handleGenerateInsights}
            onShare={handleShare}
            onDelete={handleRequestDelete}
            isAnalyzing={analyzeJobMutation.isPending || companyInsightsMutation.isPending}
          />
        ) : currentView === 'coach' ? (
          <ErrorBoundary fallbackTitle="Failed to load Coach">
            <CvUpload />
          </ErrorBoundary>
        ) : (
          <div
            className={
              upcomingInterviews.length > 0 ? 'grid grid-cols-1 gap-6 lg:grid-cols-4' : 'space-y-6'
            }
          >
            <div
              className={
                upcomingInterviews.length > 0 ? 'space-y-6 lg:col-span-3' : 'space-y-6'
              }
            >
              <ApplicationFilters
                filters={filters}
                setFilters={setFilters}
                companies={companies as any}
                totalCount={totalCount}
              />

              <section className="mt-6" aria-label="Kanban board">
                <ErrorBoundary fallbackTitle="Failed to load Kanban board">
                  <KanbanBoard
                    applications={applications}
                    isLoading={applicationsLoading}
                    onCardClick={handleOpenJob}
                    onStatusChange={(id: string | number, newStatus: string) => {
                      handleUpdateDetails(id, { status: newStatus });
                      toast.success('Application status updated');
                    }}
                  />
                </ErrorBoundary>
              </section>
            </div>

            {upcomingInterviews.length > 0 && (
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                  <ErrorBoundary fallbackTitle="Failed to load interviews">
                    <UpcomingInterviews
                      interviews={upcomingInterviews}
                      onViewPrep={handleOpenJob}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <AlertDialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setSelectedApp(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        session={session}
      />
    </div>
  );
}
