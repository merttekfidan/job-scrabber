// ===================================
// Configuration & Constants
// ===================================

const API_BASE_URL = '/api';

const STATUS_COLORS = {
    'Applied': 'applied',
    'Interview Scheduled': 'interview',
    'Interview Completed': 'interview',
    'Offer Received': 'offer',
    'Rejected': 'rejected',
    'Withdrawn': 'rejected',
    'Accepted': 'offer'
};

// ===================================
// State Management
// ===================================

const state = {
    applications: [],
    filteredApplications: [],
    analytics: null,
    companies: [],
    currentFilters: {
        search: '',
        status: '',
        workMode: '',
        company: ''
    },
    selectedApplication: null
};

// ===================================
// API Service Layer
// ===================================

const API = {
    async getAnalytics() {
        const response = await fetch(`${API_BASE_URL}?action=analytics`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        return await response.json();
    },

    async filterApplications(filters) {
        const params = new URLSearchParams();
        params.append('action', 'filter');

        if (filters.status) params.append('status', filters.status);
        if (filters.workMode) params.append('work_mode', filters.workMode);
        if (filters.company) params.append('company', filters.company);
        params.append('limit', '1000');

        const response = await fetch(`${API_BASE_URL}?${params}`);
        if (!response.ok) throw new Error('Failed to fetch applications');
        return await response.json();
    },

    async searchApplications(query) {
        const params = new URLSearchParams();
        params.append('action', 'search');
        params.append('q', query);

        const response = await fetch(`${API_BASE_URL}?${params}`);
        if (!response.ok) throw new Error('Failed to search applications');
        return await response.json();
    },

    async updateStatus(id, status) {
        const response = await fetch(`${API_BASE_URL}?action=update_status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        if (!response.ok) throw new Error('Failed to update status');
        return await response.json();
    },

    async deleteApplication(id) {
        const response = await fetch(`${API_BASE_URL}?action=delete&id=${id}`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to delete application');
        return await response.json();
    },

    async getCompanies() {
        const response = await fetch(`${API_BASE_URL}?action=companies`);
        if (!response.ok) throw new Error('Failed to fetch companies');
        return await response.json();
    }
};

// ===================================
// UI Rendering Functions
// ===================================

function renderAnalytics(analytics) {
    const statsGrid = document.getElementById('statsGrid');

    const stats = [
        {
            label: 'Total Applications',
            value: analytics.total || 0,
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>`,
            trend: analytics.last7Days > 0 ? `+${analytics.last7Days} this week` : null,
            trendDirection: 'up',
            variant: ''
        },
        {
            label: 'Interviews',
            value: analytics.byStatus?.find(s => s.status.includes('Interview'))?.count || 0,
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>`,
            trend: null,
            variant: 'success'
        },
        {
            label: 'Offers',
            value: analytics.byStatus?.find(s => s.status.includes('Offer'))?.count || 0,
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>`,
            trend: null,
            variant: 'success'
        },
        {
            label: 'Response Rate',
            value: analytics.total > 0
                ? `${Math.round(((analytics.byStatus?.find(s => s.status.includes('Interview'))?.count || 0) / analytics.total) * 100)}%`
                : '0%',
            icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>`,
            trend: null,
            variant: 'warning'
        }
    ];

    statsGrid.innerHTML = stats.map(stat => `
        <div class="stat-card ${stat.variant}">
            <div class="stat-header">
                <div class="stat-icon">
                    ${stat.icon}
                </div>
                ${stat.trend ? `
                    <div class="stat-trend ${stat.trendDirection}">
                        ${stat.trend}
                    </div>
                ` : ''}
            </div>
            <div class="stat-value">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        </div>
    `).join('');
}

function renderCharts(analytics) {
    // Status Distribution Chart
    const statusData = analytics.byStatus || [];
    if (statusData.length > 0) {
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: statusData.map(s => s.status),
                datasets: [{
                    data: statusData.map(s => s.count),
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(79, 172, 254, 0.8)',
                        'rgba(0, 242, 169, 0.8)',
                        'rgba(245, 87, 108, 0.8)',
                        'rgba(250, 112, 154, 0.8)',
                        'rgba(240, 147, 251, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#a0a0b8',
                            padding: 15,
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    }

    // Timeline Chart
    const timelineData = analytics.byMonth || [];
    if (timelineData.length > 0) {
        const timelineCtx = document.getElementById('timelineChart').getContext('2d');
        new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: timelineData.map(m => m.month),
                datasets: [{
                    label: 'Applications',
                    data: timelineData.map(m => m.count),
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#a0a0b8' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    x: {
                        ticks: { color: '#a0a0b8' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    }
                }
            }
        });
    }

    // Work Mode Chart
    const workModeData = analytics.byWorkMode || [];
    if (workModeData.length > 0) {
        const workModeCtx = document.getElementById('workModeChart').getContext('2d');
        new Chart(workModeCtx, {
            type: 'bar',
            data: {
                labels: workModeData.map(w => w.work_mode),
                datasets: [{
                    label: 'Applications',
                    data: workModeData.map(w => w.count),
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(79, 172, 254, 0.8)',
                        'rgba(240, 147, 251, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#a0a0b8' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    x: {
                        ticks: { color: '#a0a0b8' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // Top Companies
    const topCompanies = analytics.topCompanies || [];
    const topCompaniesEl = document.getElementById('topCompanies');
    if (topCompanies.length > 0) {
        topCompaniesEl.innerHTML = topCompanies.slice(0, 5).map(company => `
            <div class="company-item">
                <span class="company-name">${company.company}</span>
                <span class="company-count">${company.count}</span>
            </div>
        `).join('');
    } else {
        topCompaniesEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No data available</p>';
    }
}

function renderApplications(applications) {
    const grid = document.getElementById('applicationsGrid');
    const count = document.getElementById('applicationsCount');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    loadingState.style.display = 'none';

    count.textContent = `${applications.length} application${applications.length !== 1 ? 's' : ''}`;

    if (applications.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';

    grid.innerHTML = applications.map(app => {
        // Parse JSON fields
        const parseField = (field) => {
            try {
                if (!field) return [];
                const parsed = typeof field === 'string' ? JSON.parse(field) : field;
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        };

        const requiredSkills = parseField(app.required_skills);
        const preferredSkills = parseField(app.preferred_skills);
        const responsibilities = parseField(app.key_responsibilities);
        const allSkills = [...requiredSkills, ...preferredSkills];

        return `
            <div class="application-card" data-id="${app.id}">
                <div class="application-header">
                    <div class="application-title">
                        <h3>${app.job_title || 'Untitled Position'}</h3>
                        <div class="application-company">${app.company || 'Unknown Company'}</div>
                    </div>
                    <span class="status-badge ${STATUS_COLORS[app.status] || 'applied'}">
                        ${app.status || 'Applied'}
                    </span>
                </div>
                
                <div class="application-details">
                    ${app.location ? `
                        <div class="detail-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            ${app.location}
                        </div>
                    ` : ''}
                    
                    ${app.work_mode ? `
                        <div class="detail-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                            ${app.work_mode}
                        </div>
                    ` : ''}
                    
                    ${app.salary ? `
                        <div class="detail-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            ${app.salary}
                        </div>
                    ` : ''}
                    
                    <div class="detail-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        ${formatDate(app.application_date)}
                    </div>
                </div>
                
                ${allSkills.length > 0 ? `
                    <div class="application-skills">
                        ${allSkills.slice(0, 5).map(skill => `
                            <span class="skill-tag">${skill}</span>
                        `).join('')}
                        ${allSkills.length > 5 ? `<span class="skill-tag">+${allSkills.length - 5} more</span>` : ''}
                    </div>
                ` : ''}

                <div class="expand-indicator">
                    <span>View full offer details</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                
                <!-- Expanded Details Section -->
                <div class="application-expanded-details">
                    <!-- Offer Highlights -->
                    <div class="offer-highlights">
                        <div class="highlight-item">
                            <span class="highlight-label">Position</span>
                            <span class="highlight-value">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                                ${app.job_title || 'N/A'}
                            </span>
                        </div>
                        <div class="highlight-item">
                            <span class="highlight-label">Location</span>
                            <span class="highlight-value">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                ${app.location || 'Not specified'}
                            </span>
                        </div>
                        <div class="highlight-item">
                            <span class="highlight-label">Work Mode</span>
                            <span class="highlight-value">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                ${app.work_mode || 'Not specified'}
                            </span>
                        </div>
                        <div class="highlight-item">
                            <span class="highlight-label">Salary Range</span>
                            <span class="highlight-value">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="1" x2="12" y2="23"></line>
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                </svg>
                                ${app.salary || 'Not specified'}
                            </span>
                        </div>
                    </div>

                    ${app.company_description ? `
                        <div class="expanded-section">
                            <h4>About ${app.company}</h4>
                            <p>${app.company_description}</p>
                        </div>
                    ` : ''}

                    ${responsibilities.length > 0 ? `
                        <div class="expanded-section">
                            <h4>Key Responsibilities</h4>
                            <ul>
                                ${responsibilities.map(r => `<li>${r}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${requiredSkills.length > 0 ? `
                        <div class="expanded-section">
                            <h4>Required Skills & Qualifications</h4>
                            <div class="skills-grid">
                                ${requiredSkills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${preferredSkills.length > 0 ? `
                        <div class="expanded-section">
                            <h4>Nice to Have</h4>
                            <div class="skills-grid">
                                ${preferredSkills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="expanded-actions">
                        ${app.job_url ? `
                            <a href="${app.job_url}" target="_blank" class="btn btn-secondary" onclick="event.stopPropagation()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                                View Original Posting
                            </a>
                        ` : ''}
                        <button class="btn btn-primary" onclick="event.stopPropagation(); openFullModal(${app.id})">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Update Status
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers for expanding cards
    document.querySelectorAll('.application-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't expand if clicking on a button or link
            if (e.target.closest('button') || e.target.closest('a')) {
                return;
            }

            // Toggle expanded state
            const wasExpanded = card.classList.contains('expanded');

            // Close all other cards
            document.querySelectorAll('.application-card').forEach(c => {
                c.classList.remove('expanded');
            });

            // Toggle this card
            if (!wasExpanded) {
                card.classList.add('expanded');
                // Smooth scroll to show expanded content
                setTimeout(() => {
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 300);
            }
        });
    });
}

// Helper function to open full modal from expanded card
function openFullModal(appId) {
    const app = state.filteredApplications.find(a => a.id === appId);
    if (app) showApplicationModal(app);
}

function showApplicationModal(app) {
    state.selectedApplication = app;

    const modal = document.getElementById('applicationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = app.job_title || 'Application Details';

    // Parse JSON fields
    const parseField = (field) => {
        try {
            if (!field) return [];
            const parsed = typeof field === 'string' ? JSON.parse(field) : field;
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    };

    const responsibilities = parseField(app.key_responsibilities);
    const requiredSkills = parseField(app.required_skills);
    const preferredSkills = parseField(app.preferred_skills);

    modalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-field">
                <label>Company</label>
                <div class="value">${app.company || 'N/A'}</div>
            </div>
            <div class="detail-field">
                <label>Status</label>
                <select class="status-select" id="statusSelect">
                    <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
                    <option value="Interview Scheduled" ${app.status === 'Interview Scheduled' ? 'selected' : ''}>Interview Scheduled</option>
                    <option value="Interview Completed" ${app.status === 'Interview Completed' ? 'selected' : ''}>Interview Completed</option>
                    <option value="Offer Received" ${app.status === 'Offer Received' ? 'selected' : ''}>Offer Received</option>
                    <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    <option value="Withdrawn" ${app.status === 'Withdrawn' ? 'selected' : ''}>Withdrawn</option>
                    <option value="Accepted" ${app.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                </select>
            </div>
            <div class="detail-field">
                <label>Location</label>
                <div class="value">${app.location || 'N/A'}</div>
            </div>
            <div class="detail-field">
                <label>Work Mode</label>
                <div class="value">${app.work_mode || 'N/A'}</div>
            </div>
            <div class="detail-field">
                <label>Salary</label>
                <div class="value">${app.salary || 'N/A'}</div>
            </div>
            <div class="detail-field">
                <label>Applied Date</label>
                <div class="value">${formatDate(app.application_date)}</div>
            </div>
        </div>

        ${app.job_url ? `
            <div class="detail-section">
                <h4>Job URL</h4>
                <p><a href="${app.job_url}" target="_blank" style="color: var(--accent-purple); text-decoration: none;">${app.job_url}</a></p>
            </div>
        ` : ''}

        ${app.company_description ? `
            <div class="detail-section">
                <h4>Company Description</h4>
                <p>${app.company_description}</p>
            </div>
        ` : ''}

        ${responsibilities.length > 0 ? `
            <div class="detail-section">
                <h4>Key Responsibilities</h4>
                <ul>
                    ${responsibilities.map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>
        ` : ''}

        ${requiredSkills.length > 0 ? `
            <div class="detail-section">
                <h4>Required Skills</h4>
                <div class="application-skills">
                    ${requiredSkills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        ${preferredSkills.length > 0 ? `
            <div class="detail-section">
                <h4>Preferred Skills</h4>
                <div class="application-skills">
                    ${preferredSkills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
            </div>
        ` : ''}
    `;

    modal.classList.add('active');

    // Add status change handler
    document.getElementById('statusSelect').addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        try {
            await API.updateStatus(app.id, newStatus);
            app.status = newStatus;
            showToast('Status updated successfully!');
            await loadData(); // Refresh data
        } catch (error) {
            showToast('Failed to update status', 'error');
            console.error(error);
        }
    });
}

function populateCompanyFilter(companies) {
    const select = document.getElementById('companyFilter');
    const currentValue = select.value;

    select.innerHTML = '<option value="">All Companies</option>' +
        companies.map(c => `<option value="${c.company}">${c.company} (${c.count})</option>`).join('');

    if (currentValue) select.value = currentValue;
}

// ===================================
// Utility Functions
// ===================================

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function exportToCSV() {
    const apps = state.filteredApplications.length > 0 ? state.filteredApplications : state.applications;

    if (apps.length === 0) {
        showToast('No applications to export', 'error');
        return;
    }

    const headers = [
        'Job Title', 'Company', 'Location', 'Work Mode', 'Salary', 'Status',
        'Application Date', 'Job URL', 'Company URL'
    ];

    const rows = apps.map(app => [
        app.job_title || '',
        app.company || '',
        app.location || '',
        app.work_mode || '',
        app.salary || '',
        app.status || '',
        app.application_date || '',
        app.job_url || '',
        app.company_url || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('CSV exported successfully!');
}

// ===================================
// Data Loading & Filtering
// ===================================

async function loadData() {
    try {
        // Load analytics
        const analyticsData = await API.getAnalytics();
        state.analytics = analyticsData.analytics;
        renderAnalytics(state.analytics);
        renderCharts(state.analytics);

        // Load companies
        const companiesData = await API.getCompanies();
        state.companies = companiesData.companies || [];
        populateCompanyFilter(state.companies);

        // Load applications
        await applyFilters();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data. Please try again.', 'error');
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('emptyState').style.display = 'flex';
    }
}

async function applyFilters() {
    try {
        let applications;

        if (state.currentFilters.search) {
            // Use search API
            const data = await API.searchApplications(state.currentFilters.search);
            applications = data.applications || [];
        } else {
            // Use filter API
            const data = await API.filterApplications({
                status: state.currentFilters.status,
                workMode: state.currentFilters.workMode,
                company: state.currentFilters.company
            });
            applications = data.applications || [];
        }

        state.applications = applications;
        state.filteredApplications = applications;
        renderApplications(applications);
    } catch (error) {
        console.error('Error applying filters:', error);
        showToast('Failed to filter applications', 'error');
    }
}

function clearFilters() {
    state.currentFilters = {
        search: '',
        status: '',
        workMode: '',
        company: ''
    };

    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('workModeFilter').value = '';
    document.getElementById('companyFilter').value = '';

    applyFilters();
}

// ===================================
// Event Handlers
// ===================================

function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', loadData);

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);

    // Search input with debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.currentFilters.search = e.target.value;
            applyFilters();
        }, 500);
    });

    // Filter selects
    document.getElementById('statusFilter').addEventListener('change', (e) => {
        state.currentFilters.status = e.target.value;
        applyFilters();
    });

    document.getElementById('workModeFilter').addEventListener('change', (e) => {
        state.currentFilters.workMode = e.target.value;
        applyFilters();
    });

    document.getElementById('companyFilter').addEventListener('change', (e) => {
        state.currentFilters.company = e.target.value;
        applyFilters();
    });

    // Clear filters button
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

    // Modal close handlers
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
        el.addEventListener('click', () => {
            document.getElementById('applicationModal').classList.remove('active');
            document.getElementById('deleteModal').classList.remove('active');
        });
    });

    // Delete button
    document.getElementById('deleteBtn').addEventListener('click', () => {
        if (state.selectedApplication) {
            document.getElementById('applicationModal').classList.remove('active');
            document.getElementById('deleteModal').classList.add('active');
        }
    });

    // Confirm delete
    document.getElementById('confirmDelete').addEventListener('click', async () => {
        if (state.selectedApplication) {
            try {
                await API.deleteApplication(state.selectedApplication.id);
                showToast('Application deleted successfully!');
                document.getElementById('deleteModal').classList.remove('active');
                await loadData();
            } catch (error) {
                showToast('Failed to delete application', 'error');
                console.error(error);
            }
        }
    });

    // Cancel delete
    document.getElementById('cancelDelete').addEventListener('click', () => {
        document.getElementById('deleteModal').classList.remove('active');
    });
}

// ===================================
// Initialization
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadData();
});
