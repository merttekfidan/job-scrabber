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

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const res = await fetch('/api/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (res.ok) {
                setApplications(apps => apps.map(app =>
                    app.id === id ? { ...app, status: newStatus } : app
                ));
                if (selectedApp?.id === id) {
                    setSelectedApp(prev => ({ ...prev, status: newStatus }));
                }
                showToast('Status updated successfully');
                // Refresh stats silently
                const statsRes = await fetch('/api/stats');
                const statsData = await statsRes.json();
                setStats(statsData.stats);
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            showToast('Failed to update status', 'error');
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

                                    <div className="application-expanded-details">
                                        <div className="expanded-actions">
                                            {app.job_url && (
                                                <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" onClick={e => e.stopPropagation()}>
                                                    <ExternalLink /> View Posting
                                                </a>
                                            )}
                                            <button className="btn btn-primary" onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedApp(app);
                                            }}>
                                                details & Update
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Modal */}
            {selectedApp && (
                <div className="modal active">
                    <div className="modal-overlay" onClick={() => setSelectedApp(null)} />
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">{selectedApp.job_title}</h2>
                            <button className="modal-close" onClick={() => setSelectedApp(null)}>
                                <X />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-field">
                                    <label>Status</label>
                                    <select
                                        className="filter-select w-full"
                                        value={selectedApp.status}
                                        onChange={(e) => handleUpdateStatus(selectedApp.id, e.target.value)}
                                    >
                                        <option value="Applied">Applied</option>
                                        <option value="Interview Scheduled">Interview Scheduled</option>
                                        <option value="Offer Received">Offer Received</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Withdrawn">Withdrawn</option>
                                        <option value="Accepted">Accepted</option>
                                    </select>
                                </div>
                            </div>
                            {/* More details here */}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>Delete</button>
                            <button className="btn btn-primary" onClick={() => setSelectedApp(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

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
