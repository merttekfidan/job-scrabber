'use client';

import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Download, Search, X,
    Briefcase, MapPin, DollarSign, Calendar,
    ExternalLink, ChevronDown, CheckCircle,
    Clock, XCircle, AlertCircle
} from 'lucide-react';
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

// Register ChartJS components
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

export default function Dashboard() {
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
    const [expandedId, setExpandedId] = useState(null);
    const [activeTab, setActiveTab] = useState('details');

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
                        <button className="btn btn-secondary" onClick={exportCSV}>
                            <Download size={18} /> Export CSV
                        </button>
                        <button className="btn btn-primary" onClick={() => loadData()}>
                            <RefreshCw size={18} /> Refresh
                        </button>
                    </div>
                </div>
            </header>

            <main className="main container">
                {/* Stats Grid */}
                <section className="analytics-section">
                    <h2 className="section-title">Your Journey Overview</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon"><Briefcase /></div>
                                {stats?.last7Days > 0 && (
                                    <div className="stat-trend up">+{stats.last7Days} this week</div>
                                )}
                            </div>
                            <div className="stat-value">{stats?.total || 0}</div>
                            <div className="stat-label">Total Applications</div>
                        </div>
                        <div className="stat-card success">
                            <div className="stat-header">
                                <div className="stat-icon"><CheckCircle /></div>
                            </div>
                            <div className="stat-value">
                                {stats?.byStatus?.find(s => s.status.includes('Interview'))?.count || 0}
                            </div>
                            <div className="stat-label">Interviews</div>
                        </div>
                        <div className="stat-card success">
                            <div className="stat-header">
                                <div className="stat-icon"><CheckCircle /></div>
                            </div>
                            <div className="stat-value">
                                {stats?.byStatus?.find(s => s.status.includes('Offer'))?.count || 0}
                            </div>
                            <div className="stat-label">Offers</div>
                        </div>
                    </div>
                </section>

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
                <section className="filters-section">
                    <div className="filters-header">
                        <h2 className="section-title">Applications</h2>
                        <div className="search-box">
                            <Search className="search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search jobs..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="filters-bar">
                        <div className="filter-group">
                            <label>Status</label>
                            <select
                                className="filter-select"
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="">All Statuses</option>
                                <option value="Applied">Applied</option>
                                <option value="Interview Scheduled">Interview Scheduled</option>
                                <option value="Offer Received">Offer Received</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                        {/* More filters can be added here */}
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
                        <div className="applications-grid">
                            {applications.map(app => (
                                <div
                                    key={app.id}
                                    className={`application-card ${expandedId === app.id ? 'expanded' : ''}`}
                                    onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                                >
                                    <div className="application-header">
                                        <div className="application-title">
                                            <h3>{app.job_title}</h3>
                                            <div className="application-company">{app.company}</div>
                                        </div>
                                        <span className={`status-badge ${app.status.replace(' ', '')}`}>
                                            {app.status}
                                        </span>
                                    </div>

                                    <div className="application-details">
                                        <div className="detail-item"><MapPin /> {app.location || 'Remote'}</div>
                                        <div className="detail-item"><DollarSign /> {app.salary || 'N/A'}</div>
                                        <div className="detail-item"><Calendar /> {formatDate(app.application_date)}</div>
                                    </div>

                                    <div className="application-skills">
                                        {parseJson(app.required_skills).slice(0, 5).map((skill, i) => (
                                            <span key={i} className="skill-tag">{skill}</span>
                                        ))}
                                    </div>

                                    {expandedId === app.id && (
                                        <div className="mt-6 border-t border-gray-700/50 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                            {/* Tabs */}
                                            <div className="flex border-b border-gray-700/50 mb-6 gap-6">
                                                {['details', 'prep', 'content', 'interviews'].map((tab) => (
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
                                                        {tab === 'prep' && 'Interview Prep'}
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
                                                {/* --- DETAILS TAB --- */}
                                                {activeTab === 'details' && (
                                                    <div className="space-y-6">
                                                        {/* Company & Role Summary */}
                                                        <div className="space-y-4">
                                                            {(app.company_description) && (
                                                                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                                                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                                        <Briefcase size={12} /> Company Summary
                                                                    </h3>
                                                                    <p className="text-gray-300 leading-relaxed text-sm">{app.company_description}</p>
                                                                </div>
                                                            )}

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
                                                                            {talkingPoints.map((point, i) => (
                                                                                <li key={i} className="flex gap-3 text-gray-300 bg-amber-500/5 p-4 rounded-xl border border-amber-500/10">
                                                                                    <span className="text-amber-500 font-bold">•</span>
                                                                                    <span className="leading-relaxed">{point}</span>
                                                                                </li>
                                                                            ))}
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
                                                                                    <div className="p-3">
                                                                                        <textarea
                                                                                            className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-sm text-gray-300 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-24"
                                                                                            placeholder="Notes..."
                                                                                            value={stage.notes}
                                                                                            onClick={e => e.stopPropagation()}
                                                                                            onChange={(e) => {
                                                                                                const newStages = [...stages];
                                                                                                newStages[idx].notes = e.target.value;
                                                                                                handleUpdateDetails(app.id, { interview_stages: newStages });
                                                                                            }}
                                                                                        />
                                                                                    </div>
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
            </main>

            {/* Delete Confirmation */}
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
