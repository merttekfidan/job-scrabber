'use client';

import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Download, Briefcase,
    CheckCircle, LogOut, User, Sparkles, LayoutDashboard, LayoutList, Settings
} from 'lucide-react';
import { signOut } from '@/app/actions';
import CvUpload from './CvUpload';
import ErrorBoundary from './ErrorBoundary';
import StatsGrid from './dashboard/StatsGrid';
import UpcomingInterviews from './dashboard/UpcomingInterviews';
import ProfileModal from './dashboard/ProfileModal';
import ApplicationFilters from './dashboard/ApplicationFilters';
import ApplicationCard from './dashboard/ApplicationCard';
import SmartAnalytics from './dashboard/SmartAnalytics';
import JobDetailView from './dashboard/JobDetailView';
import KanbanBoard from './dashboard/KanbanBoard';
import { ApplicationListSkeleton } from './dashboard/Skeletons';
import { parseJson } from './dashboard/utils';

export default function Dashboard({ session }) {
    const [stats, setStats] = useState(null);
    const [applications, setApplications] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        workMode: '',
        company: '',
        sortBy: 'date_desc'
    });
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 20;
    const [selectedApp, setSelectedApp] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [view, setView] = useState('dashboard');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);

    // ─── Filter Effects ────────────────────────────────

    useEffect(() => {
        // Reset pagination when filters change
        setPage(1);
        setApplications([]);

        const timer = setTimeout(() => {
            loadData(1, true); // true indicates reset
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.status, filters.workMode, filters.company, filters.search, filters.sortBy]);

    // ─── Data Loading ──────────────────────────────────

    const loadData = async (currentPage = page, reset = false) => {
        try {
            setIsLoading(true);
            if (!stats) {
                const [statsRes, compRes] = await Promise.all([
                    fetch('/api/stats'),
                    fetch('/api/companies')
                ]);
                const [statsData, compData] = await Promise.all([
                    statsRes.json(), compRes.json()
                ]);
                setStats(statsData.stats);
                setCompanies(compData.companies || []);
            }

            let url = `/api/filter?limit=${LIMIT}&offset=${(currentPage - 1) * LIMIT}`;
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.workMode) params.append('work_mode', filters.workMode);
            if (filters.company) params.append('company', filters.company);
            if (filters.sortBy) params.append('sort_by', filters.sortBy);

            if (filters.search) {
                // If there is ongoing search, we hit the search endpoint which might not fully support pagination 
                // but we should pass limit offset anyway
                url = `/api/search?q=${encodeURIComponent(filters.search)}&limit=${LIMIT}&offset=${(currentPage - 1) * LIMIT}`;
            } else {
                url += `&${params.toString()}`;
            }

            const appRes = await fetch(url);
            const appData = await appRes.json();

            const fetchedApps = appData.applications || [];

            if (reset) {
                setApplications(fetchedApps);
            } else {
                setApplications(prev => {
                    const existingIds = new Set(prev.map(a => a.id));
                    const uniqueNew = fetchedApps.filter(a => !existingIds.has(a.id));
                    return [...prev, ...uniqueNew];
                });
            }

            setHasMore(fetchedApps.length === LIMIT);

        } catch (error) {
            console.error('Failed to load data', error);
            showToast('Failed to load data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Handlers ──────────────────────────────────────

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleUpdateDetails = async (id, updates) => {
        try {
            const res = await fetch('/api/update-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, updates })
            });
            const data = await res.json();
            if (res.ok) {
                setApplications(apps => apps.map(app =>
                    app.id === id ? { ...app, ...updates } : app
                ));
                if (selectedApp?.id === id) {
                    setSelectedApp(prev => ({ ...prev, ...updates }));
                }
                showToast('Updated successfully');
                if (updates.status) {
                    const statsRes = await fetch('/api/stats');
                    const statsData = await statsRes.json();
                    setStats(statsData.stats);
                }
            } else {
                console.error('Update API error:', res.status, data);
                throw new Error(data.error || 'Failed to update');
            }
        } catch (error) {
            console.error('handleUpdateDetails error:', error);
            showToast(error.message || 'Failed to update', 'error');
        }
    };

    const handleAnalyzeJob = async (appId) => {
        try {
            setIsAnalyzing(true);
            const res = await fetch('/api/cv/analyze-job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: appId })
            });
            if (res.ok) {
                const data = await res.json();
                setApplications(apps => apps.map(app =>
                    app.id === appId ? { ...app, personalized_analysis: data.analysis } : app
                ));
                showToast('AI Analysis completed!', 'success');
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Analysis failed');
            }
        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateInsights = async (appId) => {
        try {
            setIsAnalyzing(true);
            showToast('Generating deep insights... this may take a moment.');
            const res = await fetch('/api/ai/company-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: appId })
            });
            if (res.ok) {
                const data = await res.json();
                setApplications(apps => apps.map(app => {
                    if (app.id === appId) {
                        const currentAnalysis = app.personalized_analysis || {};
                        return { ...app, personalized_analysis: { ...currentAnalysis, companyInsights: data.insights, analyzedAt: new Date().toISOString() } };
                    }
                    return app;
                }));
                showToast('Company insights generated!', 'success');
            } else {
                throw new Error('Failed to generate insights');
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to generate insights', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleShare = (appId) => {
        const url = `${window.location.origin}/share/${appId}`;
        navigator.clipboard.writeText(url);
        showToast('Secure share link copied to clipboard!', 'success');
    };

    const handleDelete = async () => {
        if (!selectedApp) return;
        try {
            const res = await fetch(`/api/delete/${selectedApp.id}`, { method: 'DELETE' });
            if (res.ok) {
                setApplications(apps => apps.filter(a => a.id !== selectedApp.id));
                setShowDeleteModal(false);
                setSelectedApp(null);
                setSelectedJobId(null);
                showToast('Application deleted');
                const statsRes = await fetch('/api/stats');
                const statsData = await statsRes.json();
                setStats(statsData.stats);
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            showToast('Failed to delete application', 'error');
        }
    };

    const exportCSV = () => {
        if (!applications.length) return showToast('No data to export', 'error');
        const headers = ['Job Title', 'Company', 'Location', 'Status', 'Date', 'URL'];
        const rows = applications.map(a => [
            a.job_title, a.company, a.location, a.status, a.application_date, a.job_url
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c || ''}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `job-apps-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // ─── Computed Data ─────────────────────────────────

    const upcomingInterviews = applications
        .flatMap(app => {
            const stages = parseJson(app.interview_stages) || [];
            return stages.map(stage => ({ ...stage, appName: app.company, appId: app.id }));
        })
        .filter(i => new Date(i.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    // ─── Render ────────────────────────────────────────

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="glass-card sticky top-0 z-50" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
                <div className="flex items-center justify-between px-6 py-3">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="HuntIQ" className="h-8 w-8 rounded-lg object-cover" />
                        <span className="text-lg font-bold tracking-tight text-white">HuntIQ</span>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-gray-900/60 rounded-lg p-1 gap-0.5 border border-white/5">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                            { id: 'applications', label: 'Kanban Board', icon: LayoutList },
                            { id: 'coach', label: 'Coach', icon: Sparkles },
                        ].map(v => (
                            <button
                                key={v.id}
                                onClick={() => setView(v.id)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-base font-medium transition-all duration-200 ${view === v.id
                                    ? 'text-white shadow-lg'
                                    : 'text-gray-500 hover:text-gray-200'
                                    }`}
                                style={view === v.id ? {
                                    background: v.id === 'coach' ? '#7c3aed' : '#667eea',
                                    boxShadow: `0 0 12px -2px ${v.id === 'coach' ? 'rgba(124,58,237,0.5)' : 'rgba(102,126,234,0.5)'}`
                                } : {}}
                            >
                                <v.icon size={16} />
                                <span className="hidden sm:inline">{v.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setPage(1); loadData(1, true); }}
                            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800/50 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            onClick={exportCSV}
                            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800/50 transition-colors"
                            title="Export CSV"
                        >
                            <Download size={16} />
                        </button>

                        {/* User */}
                        <div className="flex items-center gap-2 pl-3 border-l border-white/10 ml-1">
                            <button
                                onClick={() => setIsProfileOpen(true)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800/50 transition-colors"
                                title="Profile Settings"
                            >
                                <Settings size={16} />
                            </button>
                            {session?.user?.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10" />
                            ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-base font-bold text-white" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                                    {(session?.user?.email || 'U')[0].toUpperCase()}
                                </div>
                            )}
                            <button
                                onClick={() => signOut()}
                                className="p-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Logout"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="main container">
                {/* Full-page Job Detail View */}
                {selectedJobId && applications.find(a => a.id === selectedJobId) ? (
                    <JobDetailView
                        app={applications.find(a => a.id === selectedJobId)}
                        onBack={() => setSelectedJobId(null)}
                        onUpdateDetails={handleUpdateDetails}
                        onAnalyzeJob={handleAnalyzeJob}
                        onGenerateInsights={handleGenerateInsights}
                        onShare={handleShare}
                        onDelete={(appToDelete) => {
                            setSelectedApp(appToDelete);
                            setShowDeleteModal(true);
                        }}
                        isAnalyzing={isAnalyzing}
                    />
                ) : view === 'coach' ? (
                    <CvUpload />
                ) : (
                    <div className={upcomingInterviews?.length > 0 ? "grid grid-cols-1 lg:grid-cols-4 gap-6" : "space-y-6"}>
                        <div className={upcomingInterviews?.length > 0 ? "lg:col-span-3 space-y-6" : "space-y-6"}>
                            {view === 'dashboard' && (
                                <>
                                    <ErrorBoundary fallbackTitle="Failed to load stats">
                                        <StatsGrid stats={stats} />
                                    </ErrorBoundary>

                                    <ErrorBoundary fallbackTitle="Failed to load analytics">
                                        <SmartAnalytics />
                                    </ErrorBoundary>
                                </>
                            )}

                            <ApplicationFilters
                                filters={filters}
                                setFilters={setFilters}
                                companies={companies}
                                totalCount={stats?.total || 0}
                            />

                            {/* Main Content Area */}
                            {view === 'applications' ? (
                                <section className="mt-6">
                                    <KanbanBoard
                                        applications={applications}
                                        isLoading={isLoading}
                                        onCardClick={(id) => setSelectedJobId(id)}
                                        onStatusChange={(id, newStatus) => {
                                            handleUpdateDetails(id, { status: newStatus });
                                            showToast('Application status updated');
                                        }}
                                    />
                                </section>
                            ) : (
                                <section className="applications-section">

                                    {isLoading && applications.length === 0 ? (
                                        <ApplicationListSkeleton count={4} />
                                    ) : applications.length === 0 ? (
                                        <div className="empty-state text-center py-20 opacity-70">
                                            <Briefcase size={48} className="mx-auto mb-4" />
                                            <h3>No applications found</h3>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {applications.map(app => (
                                                <ErrorBoundary key={app.id} fallbackTitle="Error loading application">
                                                    <ApplicationCard
                                                        app={app}
                                                        isExpanded={false}
                                                        activeTab={activeTab}
                                                        onToggleExpand={() => setSelectedJobId(app.id)}
                                                        onSetActiveTab={setActiveTab}
                                                        onUpdateDetails={handleUpdateDetails}
                                                        onAnalyzeJob={handleAnalyzeJob}
                                                        onGenerateInsights={handleGenerateInsights}
                                                        onShare={handleShare}
                                                        onDelete={(appToDelete) => {
                                                            setSelectedApp(appToDelete);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        isAnalyzing={isAnalyzing}
                                                    />
                                                </ErrorBoundary>
                                            ))}

                                            {hasMore && !isLoading && (
                                                <div className="flex justify-center mt-8">
                                                    <button
                                                        className="btn btn-secondary px-8"
                                                        onClick={() => {
                                                            const nextPage = page + 1;
                                                            setPage(nextPage);
                                                            loadData(nextPage, false);
                                                        }}
                                                    >
                                                        Load More
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>

                        {upcomingInterviews?.length > 0 && (
                            <div className="lg:col-span-1">
                                <div className="sticky top-24 space-y-6">
                                    <ErrorBoundary fallbackTitle="Failed to load interviews">
                                        <UpcomingInterviews
                                            interviews={upcomingInterviews}
                                            onViewPrep={(appId) => setSelectedJobId(appId)}
                                        />
                                    </ErrorBoundary>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal active">
                    <div className="modal-overlay" />
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Confirm Delete</h2>
                        </div>
                        <div className="modal-body">
                            Are you sure? This cannot be undone.
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                session={session}
            />

            {/* Toast */}
            <div className={`toast ${toast.show ? 'show' : ''}`}>
                <div className="toast-content">
                    <CheckCircle className="toast-icon" />
                    <span>{toast.message}</span>
                </div>
            </div>
        </div>
    );
}
