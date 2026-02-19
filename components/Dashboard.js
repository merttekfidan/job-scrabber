'use client';

import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Download, Search, X,
    Briefcase, MapPin, DollarSign, Calendar,
    ExternalLink, ChevronDown, CheckCircle,
    Clock, XCircle, AlertCircle, LogOut, User, Sparkles, LayoutDashboard, Share2,
    Calendar as CalendarIcon, Clock as ClockIcon
} from 'lucide-react';
import { signOut } from '@/app/actions';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CvUpload from './CvUpload';

// Register ChartJS components
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

function StageNoteEditor({ initialNotes, onSave }) {
    const [notes, setNotes] = useState(initialNotes || '');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setNotes(initialNotes || '');
        setIsDirty(false);
    }, [initialNotes]);

    const handleSave = () => {
        onSave(notes);
        setIsDirty(false);
    };

    return (
        <div className="p-3 flex flex-col gap-2">
            <textarea
                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-sm text-gray-300 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-24"
                placeholder="Interview notes..."
                value={notes}
                onClick={e => e.stopPropagation()}
                onChange={(e) => {
                    setNotes(e.target.value);
                    setIsDirty(true);
                }}
            />
            {isDirty && (
                <div className="flex justify-end gap-2">
                    <span className="text-xs text-amber-400 self-center">Unsaved changes</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-500 transition-colors flex items-center gap-1"
                    >
                        <CheckCircle size={12} /> Save
                    </button>
                </div>
            )}
        </div>
    );
}

function GeneralNoteEditor({ initialNotes, onSave }) {
    const [notes, setNotes] = useState(initialNotes || '');
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setNotes(initialNotes || '');
        setIsDirty(false);
    }, [initialNotes]);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(notes);
        setIsSaving(false);
        setIsDirty(false);
    };

    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="flex justify-between items-center bg-gray-800/30 p-3 rounded-t-lg border border-gray-700/50 border-b-0">
                <span className="text-sm font-medium text-gray-400">My General Notes</span>
                {isDirty ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                        }}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Save Notes
                    </button>
                ) : (
                    <span className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle size={12} /> Saved
                    </span>
                )}
            </div>
            <textarea
                className="w-full flex-1 bg-gray-900/30 border border-gray-700/50 rounded-b-lg p-6 text-base text-gray-200 focus:ring-1 focus:ring-blue-500/50 outline-none resize-none min-h-[400px] leading-relaxed"
                placeholder="Write your thoughts, to-do lists, or draft emails here..."
                value={notes}
                onChange={(e) => {
                    setNotes(e.target.value);
                    setIsDirty(true);
                }}
            />
        </div>
    );
}

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
    const [view, setView] = useState('dashboard'); // 'dashboard' or 'coach'


    useEffect(() => {
        loadData();
    }, [filters.status, filters.workMode, filters.company]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            loadData();
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const loadData = async () => {
        try {
            setIsLoading(true);

            // Load Analytics & Companies only on initial load or full refresh
            if (!stats) {
                const statsRes = await fetch('/api/stats');
                const statsData = await statsRes.json();
                setStats(statsData.stats);

                const analyticsRes = await fetch('/api/analytics');
                const analyticsData = await analyticsRes.json();
                setAnalytics(analyticsData.analytics);

                const compRes = await fetch('/api/companies');
                const compData = await compRes.json();
                setCompanies(compData.companies || []);
            }

            // Load Applications
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
                const data = await res.json();
                const updatedApp = data.application; // Helper to get fresh data

                setApplications(apps => apps.map(app =>
                    app.id === id ? { ...app, ...updates } : app // Optimistic update or use updatedApp
                ));

                if (selectedApp?.id === id) {
                    setSelectedApp(prev => ({ ...prev, ...updates }));
                }

                showToast('Updated successfully');

                // Refresh stats if status changed
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

                // Merge new insights into existing analysis
                setApplications(apps => apps.map(app => {
                    if (app.id === appId) {
                        const currentAnalysis = app.personalized_analysis || {};
                        const updatedAnalysis = {
                            ...currentAnalysis,
                            companyInsights: data.insights,
                            analyzedAt: new Date().toISOString()
                        };
                        return { ...app, personalized_analysis: updatedAnalysis };
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
        // Find the app to get the token
        const app = applications.find(a => a.id === appId);
        const token = app?.share_token || appId; // Fallback to ID if token missing (shouldn't happen with migration)

        const url = `${window.location.origin}/share/${token}`;
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
                // Refresh stats
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

    // --- Render Helpers ---

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const parseJson = (str) => {
        try {
            return typeof str === 'string' ? JSON.parse(str) : (Array.isArray(str) ? str : []);
        } catch (e) { return []; }
    };

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
                        {/* Stats Grid */}
                        <section className="analytics-section mb-8">
                            <h2 className="section-title text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Your Journey Overview</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Total Apps */}
                                <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-xl p-4 hover:bg-gray-800/40 hover:border-white/10 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                                            <Briefcase size={18} />
                                        </div>
                                        {stats?.last7Days > 0 && (
                                            <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                                                +{stats.last7Days}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">{stats?.total || 0}</div>
                                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Applications</div>
                                </div>

                                {/* Intervals (Interviews) */}
                                <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-xl p-4 hover:bg-gray-800/40 hover:border-white/10 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                                            <Clock size={18} />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {stats?.byStatus?.find(s => s.status.includes('Interview'))?.count || 0}
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Interviews Scheduled</div>
                                </div>

                                {/* Offers */}
                                <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-xl p-4 hover:bg-gray-800/40 hover:border-white/10 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400 group-hover:scale-110 transition-transform">
                                            <CheckCircle size={18} />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {stats?.byStatus?.find(s => s.status.includes('Offer'))?.count || 0}
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Offers Received</div>
                                </div>

                                {/* Rejections (Optional but balances the grid) */}
                                <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-xl p-4 hover:bg-gray-800/40 hover:border-white/10 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-red-500/10 rounded-lg text-red-400 group-hover:scale-110 transition-transform">
                                            <XCircle size={18} />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {stats?.byStatus?.find(s => s.status.includes('Rejected'))?.count || 0}
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Rejections</div>
                                </div>
                            </div>
                        </section>

                        {/* Upcoming Interviews Timeline */}
                        {(() => {
                            const upcomingInterviews = applications
                                .flatMap(app => {
                                    const stages = parseJson(app.interview_stages) || [];
                                    return stages.map(stage => ({ ...stage, appName: app.company, appId: app.id }));
                                })
                                .filter(i => new Date(i.date) >= new Date())
                                .sort((a, b) => new Date(a.date) - new Date(b.date))
                                .slice(0, 5);

                            if (upcomingInterviews.length > 0) {
                                return (
                                    <section className="timeline-section mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                                        <h2 className="section-title flex items-center gap-2">
                                            <CalendarIcon className="text-blue-400" /> Upcoming Interviews
                                        </h2>
                                        <div className="space-y-3">
                                            {upcomingInterviews.map((interview, idx) => (
                                                <div key={idx} className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-xl flex items-center justify-between hover:bg-gray-800/60 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-lg">
                                                            {new Date(interview.date).getDate()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-white">{interview.appName}</div>
                                                            <div className="text-sm text-gray-400">{interview.type} Round • {new Date(interview.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short' })}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setExpandedId(interview.appId)}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        View Prep
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                );
                            }
                        })()}

                        {/* Charts Section */}
                        {analytics && (
                            <section className="charts-section">
                                <h2 className="section-title">Analytics</h2>
                                <div className="charts-grid">
                                    <div className="chart-card">
                                        <h3 className="chart-title">Applications Over Time</h3>
                                        <div className="h-64">
                                            <Line
                                                data={{
                                                    labels: analytics.byMonth?.map(m => m.month).reverse() || [],
                                                    datasets: [{
                                                        label: 'Applications',
                                                        data: analytics.byMonth?.map(m => m.count).reverse() || [],
                                                        borderColor: '#667eea',
                                                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                                                        fill: true,
                                                        tension: 0.4
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: { legend: { display: false } },
                                                    scales: {
                                                        y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                                                        x: { grid: { display: false } }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="chart-card">
                                        <h3 className="chart-title">Status Distribution</h3>
                                        <div className="h-64 flex justify-center">
                                            <Doughnut
                                                data={{
                                                    labels: analytics.byStatus?.map(s => s.status) || [],
                                                    datasets: [{
                                                        data: analytics.byStatus?.map(s => s.count) || [],
                                                        backgroundColor: [
                                                            '#667eea', '#4facfe', '#00f2a9', '#f5576c', '#fa709a'
                                                        ],
                                                        borderWidth: 0
                                                    }]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: { position: 'right', labels: { color: '#a0a0b8' } }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Filters */}
                        <section className="analytics-section mb-6">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div className="flex-1 max-w-md">
                                    <h2 className="text-xl font-bold mb-3 text-white">Applications</h2>
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                        <input
                                            type="text"
                                            className="w-full bg-gray-900/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                            placeholder="Search jobs, companies..."
                                            value={filters.search}
                                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <select
                                            className="appearance-none bg-gray-900/40 border border-white/5 rounded-xl py-2 pl-4 pr-10 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 cursor:pointer hover:bg-gray-800/40 transition-all"
                                            value={filters.status}
                                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="Applied">Applied</option>
                                            <option value="Interview Scheduled">Interview Scheduled</option>
                                            <option value="Offer Received">Offer Received</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Applications List */}
                        <section className="applications-section">
                            <div className="applications-header">
                                <span className="applications-count">{applications.length} applications</span>
                            </div>

                            {isLoading ? (
                                <div className="loading-state text-center py-10 opacity-70">Loading...</div>
                            ) : applications.length === 0 ? (
                                <div className="empty-state text-center py-20 opacity-70">
                                    <Briefcase size={48} className="mx-auto mb-4" />
                                    <h3>No applications found</h3>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {applications.map(app => (
                                        <div
                                            key={app.id}
                                            className={`bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-xl p-4 cursor-pointer hover:bg-gray-800/40 hover:border-white/10 transition-all group ${expandedId === app.id ? 'border-blue-500/30 ring-1 ring-blue-500/20' : ''}`}
                                            onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                {/* Main Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-base font-bold text-white truncate">{app.job_title}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${app.status === 'Applied' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            app.status.includes('Interview') ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                                app.status.includes('Offer') ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-400 font-medium">{app.company}</div>
                                                </div>

                                                {/* Meta Info Compact */}
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                                                    <div className="flex items-center gap-1.5"><MapPin size={14} /> {app.location || 'Remote'}</div>
                                                    <div className="flex items-center gap-1.5"><DollarSign size={14} /> {app.salary || 'N/A'}</div>
                                                    <div className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(app.application_date)}</div>
                                                </div>
                                            </div>

                                            {/* Skills - Compact Row */}
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {parseJson(app.required_skills).slice(0, 4).map((skill, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-white/5 text-gray-400 border border-white/5 rounded text-[10px]">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {parseJson(app.required_skills).length > 4 && (
                                                    <span className="px-2 py-0.5 text-gray-500 text-[10px]">+{parseJson(app.required_skills).length - 4}</span>
                                                )}
                                            </div>

                                            {expandedId === app.id && (
                                                <div className="mt-6 border-t border-gray-700/50 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    {/* Tabs */}
                                                    <div className="flex border-b border-gray-700/50 mb-6 gap-6 overflow-x-auto">
                                                        {['details', 'company', 'prep', 'notes', 'coach', 'content', 'interviews'].map((tab) => (
                                                            <button
                                                                key={tab}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveTab(tab);
                                                                }}
                                                                className={`pb-3 font-medium text-sm transition-colors relative capitalize ${activeTab === tab
                                                                    ? 'text-blue-400'
                                                                    : 'text-gray-400 hover:text-gray-200'
                                                                    }`}
                                                            >
                                                                {tab === 'details' && 'Job Details'}
                                                                {tab === 'company' && 'Company Intelligence'}
                                                                {tab === 'prep' && 'Interview Prep'}
                                                                {tab === 'notes' && 'My Notes'}
                                                                {tab === 'coach' && 'AI Coach'}
                                                                {tab === 'content' && 'Original Post'}
                                                                {tab === 'interviews' && 'Interviews'}
                                                                {activeTab === tab && (
                                                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-t-full"></div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Content Area */}
                                                    <div className="text-gray-300">
                                                        {/* --- COMPANY TAB --- */}
                                                        {activeTab === 'company' && (
                                                            <div className="space-y-6">
                                                                <div className="flex justify-between items-center mb-6">
                                                                    <h3 className="text-xl font-bold text-white">Company Intelligence</h3>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleShare(app.id);
                                                                            }}
                                                                            className="btn btn-sm bg-gray-700 hover:bg-gray-600 border-none text-gray-300 transition-colors"
                                                                            title="Copy Public Share Link"
                                                                        >
                                                                            <Share2 size={14} className="mr-2" />
                                                                            Share
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleGenerateInsights(app.id);
                                                                            }}
                                                                            disabled={isAnalyzing}
                                                                            className="btn btn-primary btn-sm bg-indigo-600 hover:bg-indigo-500 border-none shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            {isAnalyzing ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Sparkles size={14} className="mr-2" />}
                                                                            {isAnalyzing ? 'Generating...' : 'Generate Deep Insights'}
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div className="bg-gray-800/30 p-6 rounded-2xl border border-gray-700/50 mb-6">
                                                                    <div className="flex items-center gap-4 mb-6">
                                                                        <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-bold text-2xl">
                                                                            {app.company.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="text-2xl font-bold text-white">{app.company}</h3>
                                                                            {app.company_url && (
                                                                                <a href={app.company_url} target="_blank" className="text-blue-400 hover:underline text-sm flex items-center gap-1">
                                                                                    Visit Website <ExternalLink size={12} />
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {app.company_description ? (
                                                                        <div>
                                                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">About the Company</h4>
                                                                            <p className="text-gray-300 leading-relaxed text-base">{app.company_description}</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-center py-10">
                                                                            <p className="text-gray-400 mb-6 italic">No company description available.</p>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleGenerateInsights(app.id);
                                                                                }}
                                                                                disabled={isAnalyzing}
                                                                                className="btn btn-primary btn-sm mx-auto"
                                                                            >
                                                                                {isAnalyzing ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
                                                                                Generate Company Insights
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Render AI Insights if available */}
                                                                {(() => {
                                                                    const insights = app.personalized_analysis?.companyInsights;
                                                                    if (!insights) return null;

                                                                    return (
                                                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                                <div className="bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/20">
                                                                                    <h4 className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
                                                                                        <Briefcase size={18} /> Strategic Focus
                                                                                    </h4>
                                                                                    <p className="text-gray-300 text-sm leading-relaxed">{insights.strategicFocus}</p>
                                                                                </div>
                                                                                <div className="bg-pink-500/10 p-5 rounded-2xl border border-pink-500/20">
                                                                                    <h4 className="text-pink-400 font-bold mb-2 flex items-center gap-2">
                                                                                        <User size={18} /> Culture & Values
                                                                                    </h4>
                                                                                    <p className="text-gray-300 text-sm leading-relaxed">{insights.cultureFit}</p>
                                                                                </div>
                                                                            </div>

                                                                            <div className="space-y-4">
                                                                                <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
                                                                                    <h4 className="text-green-400 font-bold mb-3">Why {app.company}?</h4>
                                                                                    <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10 text-gray-300 italic">
                                                                                        "{insights.whyUsAnswer}"
                                                                                    </div>
                                                                                </div>

                                                                                <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
                                                                                    <h4 className="text-blue-400 font-bold mb-3">Why You?</h4>
                                                                                    <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 text-gray-300 italic">
                                                                                        "{insights.whyYouAnswer}"
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}

                                                        {/* --- MY NOTES TAB --- */}
                                                        {activeTab === 'notes' && (
                                                            <div className="h-full">
                                                                <GeneralNoteEditor
                                                                    initialNotes={(() => {
                                                                        // Safely access generalNotes from interview_prep_notes
                                                                        const prep = typeof app.interview_prep_notes === 'string'
                                                                            ? parseJson(app.interview_prep_notes)
                                                                            : app.interview_prep_notes || {};
                                                                        return prep.generalNotes || '';
                                                                    })()}
                                                                    onSave={async (newNotes) => {
                                                                        // 1. Get current prep notes
                                                                        const currentPrep = typeof app.interview_prep_notes === 'string'
                                                                            ? parseJson(app.interview_prep_notes)
                                                                            : app.interview_prep_notes || {};

                                                                        // 2. Update only generalNotes
                                                                        const updatedPrep = { ...currentPrep, generalNotes: newNotes };

                                                                        // 3. Save
                                                                        await handleUpdateDetails(app.id, { interview_prep_notes: updatedPrep });
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* --- AI COACH TAB --- */}
                                                        {activeTab === 'coach' && (
                                                            <div className="space-y-6">
                                                                {!app.personalized_analysis ? (
                                                                    <div className="bg-gray-800/30 p-8 rounded-2xl border border-dashed border-gray-700 text-center">
                                                                        <Sparkles className="mx-auto mb-4 text-purple-400 animate-pulse" size={40} />
                                                                        <h3 className="text-xl font-bold text-white mb-2">Personalized AI Advice</h3>
                                                                        <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                                                            Cross-reference this job with your active CV to get a SWOT analysis and tailored interview talking points.
                                                                        </p>
                                                                        <button
                                                                            className="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none shadow-lg shadow-purple-900/20"
                                                                            onClick={(e) => { e.stopPropagation(); handleAnalyzeJob(app.id); }}
                                                                            disabled={isAnalyzing}
                                                                        >
                                                                            {isAnalyzing ? (
                                                                                <>
                                                                                    <RefreshCw size={18} className="animate-spin mr-2" />
                                                                                    Analyzing CV & Job...
                                                                                </>
                                                                            ) : (
                                                                                'Generate Personalized Insights'
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-8">
                                                                        {/* SWOT Grid */}
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            {/* Strengths */}
                                                                            <div className="bg-green-500/5 border border-green-500/20 p-5 rounded-2xl">
                                                                                <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                                                                                    <CheckCircle size={18} /> Strengths
                                                                                </h4>
                                                                                <ul className="space-y-2">
                                                                                    {parseJson(app.personalized_analysis.swot?.strengths).map((s, i) => (
                                                                                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                                                            <span className="text-green-500 mt-1">•</span> {s}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                            {/* Weaknesses */}
                                                                            <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl">
                                                                                <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                                                                                    <AlertCircle size={18} /> Gaps / Weaknesses
                                                                                </h4>
                                                                                <ul className="space-y-2">
                                                                                    {parseJson(app.personalized_analysis.swot?.weaknesses).map((w, i) => (
                                                                                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                                                            <span className="text-red-500 mt-1">•</span> {w}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                            {/* Opportunities */}
                                                                            <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl">
                                                                                <h4 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                                                                                    <Sparkles size={18} /> Opportunities
                                                                                </h4>
                                                                                <ul className="space-y-2">
                                                                                    {parseJson(app.personalized_analysis.swot?.opportunities).map((o, i) => (
                                                                                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                                                            <span className="text-blue-500 mt-1">•</span> {o}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                            {/* Threats */}
                                                                            <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl">
                                                                                <h4 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                                                                                    <XCircle size={18} /> Risks / Threats
                                                                                </h4>
                                                                                <ul className="space-y-2">
                                                                                    {parseJson(app.personalized_analysis.swot?.threats).map((t, i) => (
                                                                                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                                                            <span className="text-amber-500 mt-1">•</span> {t}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        </div>

                                                                        {/* Personal Coaching Note */}
                                                                        <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl">
                                                                            <h4 className="text-purple-400 font-bold mb-4 flex items-center gap-2 text-lg">
                                                                                <User size={20} /> Career Coach's Strategy
                                                                            </h4>
                                                                            <div className="text-gray-200 leading-relaxed text-sm mb-6 bg-purple-500/5 p-4 rounded-xl italic">
                                                                                "{app.personalized_analysis.prep?.tailoredAdvice}"
                                                                            </div>
                                                                            <div className="space-y-4">
                                                                                <h5 className="text-white font-semibold text-sm uppercase tracking-wider">Tailored Talking Points</h5>
                                                                                <div className="grid grid-cols-1 gap-3">
                                                                                    {parseJson(app.personalized_analysis.prep?.keyTalkingPoints).map((tp, i) => (
                                                                                        <div key={i} className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
                                                                                            <div className="font-bold text-white mb-1">{tp.point}</div>
                                                                                            <div className="text-gray-400 text-sm">{tp.explanation}</div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex justify-between items-center text-[10px] text-gray-500 px-2">
                                                                            <span>Analyzed using CV: {app.personalized_analysis.cvFilename}</span>
                                                                            <button
                                                                                className="hover:text-purple-400 transition-colors underline"
                                                                                onClick={(e) => { e.stopPropagation(); handleAnalyzeJob(app.id); }}
                                                                                disabled={isAnalyzing}
                                                                            >
                                                                                {isAnalyzing ? 'Re-analyzing...' : 'Refresh Analysis'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {/* --- DETAILS TAB --- */}
                                                        {activeTab === 'details' && (
                                                            <div className="space-y-6">
                                                                {/* Company & Role Summary */}
                                                                <div className="space-y-4">
                                                                    {(app.role_summary) && (
                                                                        <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                                                                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                                                <Search size={12} /> Position Summary
                                                                            </h3>
                                                                            <p className="text-gray-300 leading-relaxed text-sm">{app.role_summary}</p>
                                                                        </div>
                                                                    )}

                                                                    {/* Negative Signals / Not Looking For */}
                                                                    {(() => {
                                                                        const negativeSignals = parseJson(app.negative_signals);
                                                                        if (negativeSignals && negativeSignals.length > 0) {
                                                                            return (
                                                                                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30">
                                                                                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                                        <XCircle size={14} /> Who They Are NOT Looking For
                                                                                    </h3>
                                                                                    <ul className="space-y-2">
                                                                                        {negativeSignals.map((signal, idx) => (
                                                                                            <li key={idx} className="flex gap-2 text-red-200/80 text-sm">
                                                                                                <span className="text-red-500 font-bold">•</span>
                                                                                                <span>{signal}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Status</label>
                                                                        <select
                                                                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                                            value={app.status}
                                                                            onClick={e => e.stopPropagation()}
                                                                            onChange={(e) => handleUpdateDetails(app.id, { status: e.target.value })}
                                                                        >
                                                                            <option value="Applied">Applied</option>
                                                                            <option value="Interview Scheduled">Interview Scheduled</option>
                                                                            <option value="Offer Received">Offer Received</option>
                                                                            <option value="Rejected">Rejected</option>
                                                                            <option value="Withdrawn">Withdrawn</option>
                                                                            <option value="Accepted">Accepted</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Salary</label>
                                                                        <div className="text-lg font-medium text-white">{app.salary || 'Not listed'}</div>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                                        <span className="p-1 bg-blue-500/10 rounded-md text-blue-400"><Briefcase size={16} /></span>
                                                                        Key Responsibilities
                                                                    </h3>
                                                                    <ul className="space-y-2">
                                                                        {parseJson(app.key_responsibilities).map((item, index) => (
                                                                            <li key={index} className="flex gap-3 text-gray-300 bg-gray-800/30 p-3 rounded-lg border border-gray-700/30">
                                                                                <span className="text-blue-400 mt-1">•</span>
                                                                                <span className="leading-relaxed">{item}</span>
                                                                            </li>
                                                                        ))}
                                                                        {parseJson(app.key_responsibilities).length === 0 && (
                                                                            <p className="text-gray-500 italic">No responsibilities extracted.</p>
                                                                        )}
                                                                    </ul>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div>
                                                                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                                            <span className="p-1 bg-green-500/10 rounded-md text-green-400">✓</span>
                                                                            Required Skills
                                                                        </h3>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {parseJson(app.required_skills).map((skill, index) => (
                                                                                <span key={index} className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-sm font-medium border border-green-500/20">
                                                                                    {skill}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                                                            <span className="p-1 bg-purple-500/10 rounded-md text-purple-400">★</span>
                                                                            Preferred Skills
                                                                        </h3>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {parseJson(app.preferred_skills).map((skill, index) => (
                                                                                <span key={index} className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-sm font-medium border border-purple-500/20">
                                                                                    {skill}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex justify-end pt-4 border-t border-gray-700/50">
                                                                    <button
                                                                        className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedApp(app); // Use selectedApp just for delete confirmation modal
                                                                            setShowDeleteModal(true);
                                                                        }}
                                                                    >
                                                                        <XCircle size={16} /> Delete Application
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* --- PREP TAB --- */}
                                                        {activeTab === 'prep' && (
                                                            <div className="space-y-6">
                                                                {(() => {
                                                                    const prep = typeof app.interview_prep_notes === 'string'
                                                                        ? parseJson(app.interview_prep_notes)
                                                                        : app.interview_prep_notes || {};
                                                                    const talkingPoints = parseJson(app.interview_prep_key_talking_points);
                                                                    const questions = parseJson(app.interview_prep_questions_to_ask);
                                                                    const redFlags = parseJson(app.interview_prep_potential_red_flags);
                                                                    const techStack = prep.techStackToStudy || [];

                                                                    return (
                                                                        <>
                                                                            <div>
                                                                                <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
                                                                                    <span className="p-1 bg-amber-500/10 rounded-md">💡</span> Key Talking Points
                                                                                </h3>
                                                                                <ul className="space-y-3">
                                                                                    {talkingPoints.map((item, i) => {
                                                                                        const isObj = typeof item === 'object' && item !== null;
                                                                                        const pointText = isObj ? item.point : item;
                                                                                        const explanation = isObj ? item.explanation : null;

                                                                                        return (
                                                                                            <li key={i} className="group">
                                                                                                {explanation ? (
                                                                                                    <details
                                                                                                        name={`talking-points-${app.id}`}
                                                                                                        className="group/details bg-amber-500/5 rounded-xl border border-amber-500/10 overflow-hidden open:bg-amber-500/10 transition-colors"
                                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                                    >
                                                                                                        <summary
                                                                                                            className="flex gap-3 text-gray-300 p-4 cursor-pointer hover:bg-amber-500/10 transition-colors list-none select-none items-start"
                                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                                        >
                                                                                                            <span className="text-amber-500 font-bold mt-0.5 text-lg w-5 text-center flex-shrink-0">
                                                                                                                <span className="block group-open/details:hidden">+</span>
                                                                                                                <span className="hidden group-open/details:block">−</span>
                                                                                                            </span>
                                                                                                            <div className="flex-1">
                                                                                                                <span className="font-semibold text-amber-100">{pointText}</span>
                                                                                                            </div>
                                                                                                        </summary>
                                                                                                        <div className="px-4 pb-4 pl-12 text-gray-400 text-sm leading-relaxed animate-in slide-in-from-top-1 duration-200">
                                                                                                            {explanation}
                                                                                                        </div>
                                                                                                    </details>
                                                                                                ) : (
                                                                                                    <div className="flex gap-3 text-gray-300 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                                                                                                        <span className="text-amber-500 font-bold">•</span>
                                                                                                        <span className="leading-relaxed">{pointText}</span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </li>
                                                                                        );
                                                                                    })}
                                                                                </ul>
                                                                            </div>

                                                                            {techStack.length > 0 && (
                                                                                <div>
                                                                                    <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                                                                                        <span className="p-1 bg-cyan-500/10 rounded-md">💻</span> Tech Stack to Study
                                                                                    </h3>
                                                                                    <ul className="space-y-3">
                                                                                        {techStack.map((item, i) => (
                                                                                            <li key={i} className="flex gap-3 text-gray-300 bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/10">
                                                                                                <span className="text-cyan-500 font-bold">📚</span>
                                                                                                <span className="leading-relaxed">{item}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}

                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                                <div>
                                                                                    <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                                                                                        <span className="p-1 bg-blue-500/10 rounded-md">❓</span> Questions to Ask
                                                                                    </h3>
                                                                                    <ul className="space-y-3">
                                                                                        {questions.map((q, i) => (
                                                                                            <li key={i} className="flex gap-3 text-gray-300 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                                                                                                <span className="text-blue-500 font-bold">?</span>
                                                                                                <span>{q}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                                <div>
                                                                                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                                                                                        <span className="p-1 bg-red-500/10 rounded-md">🚩</span> Potential Red Flags
                                                                                    </h3>
                                                                                    <ul className="space-y-3">
                                                                                        {redFlags.map((flag, i) => (
                                                                                            <li key={i} className="flex gap-3 text-gray-300 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                                                                                                <span className="text-red-500 font-bold">!</span>
                                                                                                <span>{flag}</span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}

                                                        {/* --- ORIGINAL CONTENT TAB --- */}
                                                        {activeTab === 'content' && (
                                                            <div className="space-y-4">
                                                                <div className="flex justify-between items-center bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
                                                                    <div className="text-sm text-gray-400">
                                                                        Archived from <a href={app.job_url} target="_blank" className="text-blue-400 hover:underline">{new URL(app.job_url).hostname}</a>
                                                                    </div>
                                                                    <a href={app.job_url} target="_blank" className="btn btn-sm btn-secondary flex items-center gap-2">
                                                                        <ExternalLink size={14} /> View Live
                                                                    </a>
                                                                </div>
                                                                <div className="bg-gray-950/50 rounded-xl border border-gray-700/50 p-8 max-h-[600px] overflow-y-auto">
                                                                    {app.formatted_content ? (
                                                                        <div className="prose prose-invert prose-sm max-w-none prose-headings:text-blue-300 prose-a:text-blue-400 prose-strong:text-gray-200 prose-ul:list-disc prose-ul:pl-5">
                                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{app.formatted_content}</ReactMarkdown>
                                                                        </div>
                                                                    ) : app.original_content ? (
                                                                        <article className="prose prose-invert prose-sm max-w-none prose-headings:text-blue-300 prose-a:text-blue-400 prose-strong:text-gray-200">
                                                                            <div className="whitespace-pre-wrap font-sans text-gray-300 text-base leading-7 tracking-wide">{app.original_content}</div>
                                                                        </article>
                                                                    ) : (
                                                                        <div className="text-center py-12 text-gray-500">
                                                                            <Briefcase size={32} className="mx-auto mb-3 opacity-50" />
                                                                            <p>No content archived for this application.</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* --- INTERVIEWS TAB --- */}
                                                        {activeTab === 'interviews' && (
                                                            <div className="space-y-6">
                                                                {(() => {
                                                                    const stages = parseJson(app.interview_stages) || [];
                                                                    // We need local state for the active inner tab. 
                                                                    // Since we are mapping inside the loop, we can't easily use a single top-level state for all cards' active interview tabs without a map.
                                                                    // BUT, React components should arguably be extracted. 
                                                                    // For now, I'll default to showing all or just using the stored state if I can't use `useState`.
                                                                    // Actually, I can use a simpler UI: List all rounds vertically! It's cleaner for inline expansion.

                                                                    return (
                                                                        <div className="space-y-4">
                                                                            <div className="flex justify-between items-center mb-4">
                                                                                <h3 className="text-lg font-bold text-white">Interview Rounds</h3>
                                                                                <button
                                                                                    className="btn btn-secondary btn-sm flex items-center gap-2"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const newStage = {
                                                                                            id: Date.now(),
                                                                                            round: `Round ${stages.length + 1}`,
                                                                                            date: new Date().toISOString().split('T')[0],
                                                                                            type: 'Screening',
                                                                                            notes: ''
                                                                                        };
                                                                                        handleUpdateDetails(app.id, { interview_stages: [...stages, newStage] });
                                                                                    }}
                                                                                >
                                                                                    <div className="w-4 h-4 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">+</div>
                                                                                    Add Round
                                                                                </button>
                                                                            </div>

                                                                            {stages.length === 0 ? (
                                                                                <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                                                                                    <p className="text-gray-400 text-sm">No interviews tracked yet.</p>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="grid grid-cols-1 gap-4">
                                                                                    {stages.map((stage, idx) => (
                                                                                        <div key={stage.id || idx} className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                                                                                            <div className="p-3 bg-gray-800/80 border-b border-gray-700/50 flex flex-wrap gap-3 items-center justify-between">
                                                                                                <div className="flex items-center gap-3">
                                                                                                    <span className="font-bold text-blue-400 text-sm">{stage.round}</span>
                                                                                                    <select
                                                                                                        className="bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg p-1.5 outline-none"
                                                                                                        value={stage.type}
                                                                                                        onClick={e => e.stopPropagation()}
                                                                                                        onChange={(e) => {
                                                                                                            const newStages = [...stages];
                                                                                                            newStages[idx].type = e.target.value;
                                                                                                            handleUpdateDetails(app.id, { interview_stages: newStages });
                                                                                                        }}
                                                                                                    >
                                                                                                        <option value="Screening">Screening</option>
                                                                                                        <option value="Technical">Technical</option>
                                                                                                        <option value="Behavioral">Behavioral</option>
                                                                                                        <option value="Final">Final</option>
                                                                                                    </select>
                                                                                                </div>
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <input
                                                                                                        type="date"
                                                                                                        className="bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg p-1.5 outline-none"
                                                                                                        value={stage.date}
                                                                                                        onClick={e => e.stopPropagation()}
                                                                                                        onChange={(e) => {
                                                                                                            const newStages = [...stages];
                                                                                                            newStages[idx].date = e.target.value;
                                                                                                            handleUpdateDetails(app.id, { interview_stages: newStages });
                                                                                                        }}
                                                                                                    />
                                                                                                    <button
                                                                                                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            if (confirm('Delete round?')) {
                                                                                                                const newStages = stages.filter((_, i) => i !== idx);
                                                                                                                handleUpdateDetails(app.id, { interview_stages: newStages });
                                                                                                            }
                                                                                                        }}
                                                                                                    >
                                                                                                        <X size={14} />
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                            <StageNoteEditor
                                                                                                initialNotes={stage.notes}
                                                                                                onSave={(newNotes) => {
                                                                                                    const newStages = [...stages];
                                                                                                    newStages[idx].notes = newNotes;
                                                                                                    handleUpdateDetails(app.id, { interview_stages: newStages });
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            {/* Delete Confirmation */}
            {
                showDeleteModal && (
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
                )
            }

            {/* Toast */}
            <div className={`toast ${toast.show ? 'show' : ''}`}>
                <div className="toast-content">
                    <CheckCircle className="toast-icon" />
                    <span>{toast.message}</span>
                </div>
            </div>
        </div >
    );
}
