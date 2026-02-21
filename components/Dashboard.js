'use client';

import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Download, Briefcase,
    CheckCircle, LogOut, User, Sparkles, LayoutDashboard
} from 'lucide-react';
import { signOut } from '@/app/actions';
import CvUpload from './CvUpload';
import ErrorBoundary from './ErrorBoundary';
import StatsGrid from './dashboard/StatsGrid';
import UpcomingInterviews from './dashboard/UpcomingInterviews';
import AnalyticsCharts from './dashboard/AnalyticsCharts';
import ApplicationFilters from './dashboard/ApplicationFilters';
import ApplicationCard from './dashboard/ApplicationCard';
import SmartAnalytics from './dashboard/SmartAnalytics';
import { ApplicationListSkeleton } from './dashboard/Skeletons';
import { parseJson } from './dashboard/utils';

export default function Dashboard({ session }) {
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [applications, setApplications] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        workMode: '',
        company: ''
    });
    const [selectedApp, setSelectedApp] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [view, setView] = useState('dashboard');

    useEffect(() => {
        loadData();
    }, [filters.status, filters.workMode, filters.company]);

    useEffect(() => {
        const timer = setTimeout(() => loadData(), 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    // ─── Data Loading ──────────────────────────────────

    const loadData = async () => {
        try {
            setIsLoading(true);
            if (!stats) {
                const [statsRes, analyticsRes, compRes] = await Promise.all([
                    fetch('/api/stats'),
                    fetch('/api/analytics'),
                    fetch('/api/companies')
                ]);
                const [statsData, analyticsData, compData] = await Promise.all([
                    statsRes.json(), analyticsRes.json(), compRes.json()
                ]);
                setStats(statsData.stats);
                setAnalytics(analyticsData.analytics);
                setCompanies(compData.companies || []);
            }

            let url = '/api/filter?limit=100';
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.workMode) params.append('work_mode', filters.workMode);
            if (filters.company) params.append('company', filters.company);

            if (filters.search) {
                url = `/api/search?q=${encodeURIComponent(filters.search)}`;
            } else {
                url += `&${params.toString()}`;
            }

            const appRes = await fetch(url);
            const appData = await appRes.json();
            setApplications(appData.applications || []);
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
                throw new Error('Failed to update');
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to update', 'error');
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
            <header className="header">
                <div className="container header-content">
                    <div className="logo">
                        <Briefcase className="logo-icon" />
                        <h1>Job Tracker</h1>
                    </div>
                    <div className="header-actions">
                        <div className="flex bg-gray-900/40 p-1 rounded-xl border border-white/5 mr-4">
                            <button
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                                onClick={() => setView('dashboard')}
                            >
                                <LayoutDashboard size={16} /> Dashboard
                            </button>
                            <button
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${view === 'coach' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                                onClick={() => setView('coach')}
                            >
                                <Sparkles size={16} /> Personal Coach
                            </button>
                        </div>
                        <button className="btn btn-secondary" onClick={exportCSV}>
                            <Download size={18} /> Export CSV
                        </button>
                        <button className="btn btn-primary" onClick={() => loadData()}>
                            <RefreshCw size={18} /> Refresh
                        </button>

                        <div className="flex items-center gap-3 pl-4 border-l border-white/10 ml-2">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <User size={16} />
                                <span className="hidden md:inline">{session?.user?.email}</span>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                            >
                                <LogOut size={16} />
                                <span className="hidden md:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="main container">
                {view === 'coach' ? (
                    <CvUpload />
                ) : (
                    <>
                        <ErrorBoundary fallbackTitle="Failed to load stats">
                            <StatsGrid stats={stats} />
                        </ErrorBoundary>

                        <ErrorBoundary fallbackTitle="Failed to load analytics">
                            <SmartAnalytics />
                        </ErrorBoundary>

                        <ErrorBoundary fallbackTitle="Failed to load interviews">
                            <UpcomingInterviews
                                interviews={upcomingInterviews}
                                onViewPrep={(appId) => setExpandedId(appId)}
                            />
                        </ErrorBoundary>

                        <ErrorBoundary fallbackTitle="Failed to load charts">
                            <AnalyticsCharts analytics={analytics} />
                        </ErrorBoundary>

                        <ApplicationFilters filters={filters} setFilters={setFilters} />

                        {/* Applications List */}
                        <section className="applications-section">
                            <div className="applications-header">
                                <span className="applications-count">{applications.length} applications</span>
                            </div>

                            {isLoading ? (
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
                                                isExpanded={expandedId === app.id}
                                                activeTab={activeTab}
                                                onToggleExpand={() => setExpandedId(expandedId === app.id ? null : app.id)}
                                                onSetActiveTab={setActiveTab}
                                                onUpdateDetails={handleUpdateDetails}
                                                onAnalyzeJob={handleAnalyzeJob}
                                                onGenerateInsights={handleGenerateInsights}
                                                onShare={handleShare}
                                                onDelete={(app) => {
                                                    setSelectedApp(app);
                                                    setShowDeleteModal(true);
                                                }}
                                                isAnalyzing={isAnalyzing}
                                            />
                                        </ErrorBoundary>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
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
