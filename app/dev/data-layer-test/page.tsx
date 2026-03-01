'use client';

/**
 * Dev-only page to manually test Phase 1 data layer hooks.
 * Open: http://localhost:3000/dev/data-layer-test (when logged in)
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  useStats,
  useCompanies,
  useProfile,
  useApplications,
  useCreateApplication,
  useUpdateApplicationStatus,
  useDeleteApplication,
  useUploadCv,
  useAnalyzeJob,
  useCompanyInsights,
  useHiringFrameworks,
} from '@/hooks';
import type { Application, ApplicationFilters } from '@/types/application';
import { toast } from 'sonner';

const DEFAULT_FILTERS: ApplicationFilters = { limit: 20, offset: 0, sortBy: 'date_desc' };

export default function DataLayerTestPage() {
  const [filters, setFilters] = useState<ApplicationFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [createForm, setCreateForm] = useState({
    jobTitle: 'Test Job',
    company: 'Test Co',
    jobUrl: 'https://example.com/job',
    applicationDate: new Date().toISOString().slice(0, 10),
  });

  const stats = useStats();
  const companies = useCompanies();
  const profile = useProfile();
  const applications = useApplications(filters);
  const createApp = useCreateApplication();
  const updateStatus = useUpdateApplicationStatus();
  const deleteApp = useDeleteApplication();
  const uploadCv = useUploadCv();
  const analyzeJob = useAnalyzeJob(selectedId);
  const companyInsights = useCompanyInsights(selectedId);
  const hiringFrameworks = useHiringFrameworks(selectedId);

  const selectedApp = applications.data?.find((a) => String(a.id) === String(selectedId)) ?? null;

  const handleCreate = async () => {
    try {
      await createApp.mutateAsync({
        ...createForm,
        jobTitle: createForm.jobTitle,
        company: createForm.company,
        jobUrl: createForm.jobUrl,
        applicationDate: createForm.applicationDate,
      });
      toast.success('Application created');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Create failed');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success('Status updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await deleteApp.mutateAsync(id);
      toast.success('Deleted');
      setSelectedId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const handleAnalyze = async () => {
    if (selectedId == null) return;
    try {
      await analyzeJob.mutateAsync(selectedId);
      toast.success('Job analyzed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analyze failed');
    }
  };

  const handleInsights = async () => {
    if (selectedId == null) return;
    try {
      await companyInsights.mutateAsync(selectedId);
      toast.success('Insights generated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Insights failed');
    }
  };

  const handleFramework = async (framework: string) => {
    if (selectedId == null) return;
    try {
      await hiringFrameworks.mutateAsync(framework);
      toast.success(`Framework ${framework} generated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Framework failed');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadCv.mutate(file, {
      onSuccess: () => toast.success('CV uploaded'),
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Phase 1 — Data layer manual test</h1>
        <p className="text-muted-foreground text-sm">
          You must be logged in. Use React Query DevTools to inspect cache keys and invalidation.
        </p>
      </div>

      {/* Stats */}
      <section className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">useStats()</h2>
        {stats.isLoading && <p className="text-muted-foreground">Loading…</p>}
        {stats.error && <p className="text-destructive">{String(stats.error)}</p>}
        {stats.data && (
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(stats.data, null, 2)}
          </pre>
        )}
      </section>

      {/* Companies */}
      <section className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">useCompanies()</h2>
        {companies.isLoading && <p className="text-muted-foreground">Loading…</p>}
        {companies.data && (
          <p className="text-sm">{companies.data.length} companies (e.g. {companies.data.slice(0, 3).map((c) => c.company).join(', ')})</p>
        )}
      </section>

      {/* Profile */}
      <section className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">useProfile()</h2>
        {profile.isLoading && <p className="text-muted-foreground">Loading…</p>}
        {profile.data && (
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
            {JSON.stringify(profile.data, null, 2)}
          </pre>
        )}
      </section>

      {/* Applications */}
      <section className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">useApplications(filters)</h2>
        <div className="flex gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters((f) => ({ ...f, status: f.status ? '' : 'Applied' }))}
          >
            Toggle status filter
          </Button>
          <Button variant="outline" size="sm" onClick={() => applications.refetch()}>
            Refetch
          </Button>
        </div>
        {applications.isLoading && <p className="text-muted-foreground">Loading…</p>}
        {applications.data && (
          <ul className="text-sm space-y-1 max-h-48 overflow-auto">
            {applications.data.map((app: Application) => (
              <li key={app.id} className="flex items-center gap-2">
                <span>{app.job_title} @ {app.company}</span>
                <span className="text-muted-foreground">({app.status})</span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSelectedId(selectedId === app.id ? null : app.id)}
                >
                  {selectedId === app.id ? 'Unselect' : 'Select'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Create application */}
      <section className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">useCreateApplication()</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <input
            className="border rounded px-2 py-1 text-sm w-32"
            placeholder="Job title"
            value={createForm.jobTitle}
            onChange={(e) => setCreateForm((f) => ({ ...f, jobTitle: e.target.value }))}
          />
          <input
            className="border rounded px-2 py-1 text-sm w-32"
            placeholder="Company"
            value={createForm.company}
            onChange={(e) => setCreateForm((f) => ({ ...f, company: e.target.value }))}
          />
          <input
            className="border rounded px-2 py-1 text-sm w-40"
            placeholder="Job URL"
            value={createForm.jobUrl}
            onChange={(e) => setCreateForm((f) => ({ ...f, jobUrl: e.target.value }))}
          />
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={createForm.applicationDate}
            onChange={(e) => setCreateForm((f) => ({ ...f, applicationDate: e.target.value }))}
          />
          <Button onClick={handleCreate} disabled={createApp.isPending}>
            {createApp.isPending ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </section>

      {/* Selected app — mutations */}
      {selectedApp && (
        <section className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Selected: {selectedApp.job_title} (id={selectedApp.id})</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(Number(selectedApp.id), 'Interview Scheduled')}
              disabled={updateStatus.isPending}
            >
              Set status → Interview
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(selectedApp.id)}
              disabled={deleteApp.isPending}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={analyzeJob.isPending}
            >
              {analyzeJob.isPending ? 'Analyzing…' : 'Analyze job (SWOT)'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleInsights}
              disabled={companyInsights.isPending}
            >
              {companyInsights.isPending ? 'Generating…' : 'Company insights'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleFramework('star')} disabled={hiringFrameworks.isPending}>
              Framework: star
            </Button>
          </div>
        </section>
      )}

      {/* CV upload */}
      <section className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">useUploadCv()</h2>
        <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={uploadCv.isPending} />
        {uploadCv.isPending && <span className="text-sm text-muted-foreground ml-2">Uploading…</span>}
      </section>
    </div>
  );
}
