'use client';

import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Search, X, ChevronDown,
    Briefcase, MapPin, DollarSign, Banknote, Calendar, Building2,
    ExternalLink, CheckCircle, XCircle,
    AlertCircle, AlertTriangle, User, Sparkles, Share2,
    GraduationCap, MessageSquare, Bot, FileText, Users
} from 'lucide-react';
import { parseJson, formatDate, getStatusClass } from './utils';
import { formatSalary } from '@/lib/currencyUtils';

// ─── Sub-components ────────────────────────────────────────────
import { CompanyTab } from './tabs/CompanyTab';
import { NotesTab } from './tabs/NotesTab';
import { CoachTab } from './tabs/CoachTab';
import { DetailsTab } from './tabs/DetailsTab';
import { PrepTab } from './tabs/PrepTab';
import { ContentTab } from './tabs/ContentTab';
import { InterviewsTab } from './tabs/InterviewsTab';

// ─── Main ApplicationCard ──────────────────────────────────────

function ApplicationCardComponent({
    app,
    isExpanded,
    activeTab,
    onToggleExpand,
    onSetActiveTab,
    onUpdateDetails,
    onAnalyzeJob,
    onGenerateInsights,
    onShare,
    onDelete,
    isAnalyzing,
}) {
    return (
        <div className={`glass-card-hover overflow-hidden ${isExpanded ? 'glow-border' : ''}`}>
            {/* Collapsed Header */}
            <button
                className="w-full p-5 text-left"
                onClick={onToggleExpand}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold truncate text-white">{app.job_title}</h3>
                            <span className={`status-badge ${app.status?.toLowerCase().replace(/\s+/g, '')}`}>
                                {app.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-base text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1"><Building2 size={12} />{app.company}</span>
                            <span className="flex items-center gap-1"><MapPin size={12} />{app.location || 'Remote'}</span>
                            <span className="flex items-center gap-1"><DollarSign size={12} />{app.salary ? formatSalary(app.salary, app.location) : 'N/A'}</span>
                            <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(app.application_date)}</span>
                        </div>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                            {parseJson(app.required_skills).slice(0, 4).map((skill, i) => (
                                <span key={i} className="px-2 py-0.5 text-[10px] rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium max-w-[150px] truncate" title={skill}>
                                    {skill}
                                </span>
                            ))}
                            {parseJson(app.required_skills).length > 4 && (
                                <span className="text-[10px] text-gray-600 self-center">+{parseJson(app.required_skills).length - 4}</span>
                            )}
                        </div>
                    </div>
                    <ChevronDown size={18} className={`text-gray-500 transition-transform shrink-0 mt-1 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4">
                    {/* Tabs */}
                    <div className="flex gap-1 mb-6 overflow-x-auto bg-gray-900/40 rounded-lg p-1">
                        {[
                            { id: 'details', label: 'Details', icon: Briefcase },
                            { id: 'company', label: 'Intel', icon: Building2 },
                            { id: 'prep', label: 'Prep', icon: GraduationCap },
                            { id: 'notes', label: 'Notes', icon: MessageSquare },
                            { id: 'coach', label: 'Coach', icon: Bot },
                            { id: 'content', label: 'Post', icon: FileText },
                            { id: 'interviews', label: 'Interviews', icon: Users },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={(e) => { e.stopPropagation(); onSetActiveTab(tab.id); }}
                                className={`tab-trigger ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                <tab.icon size={12} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Contents */}
                    <div className="text-gray-300">
                        {activeTab === 'company' && (
                            <CompanyTab app={app} isAnalyzing={isAnalyzing} onGenerateInsights={onGenerateInsights} onShare={onShare} />
                        )}
                        {activeTab === 'notes' && (
                            <NotesTab app={app} onUpdateDetails={onUpdateDetails} />
                        )}
                        {activeTab === 'coach' && (
                            <CoachTab app={app} isAnalyzing={isAnalyzing} onAnalyzeJob={onAnalyzeJob} onUpdateDetails={onUpdateDetails} />
                        )}
                        {activeTab === 'details' && (
                            <DetailsTab app={app} onUpdateDetails={onUpdateDetails} onDelete={onDelete} />
                        )}
                        {activeTab === 'prep' && (
                            <PrepTab app={app} />
                        )}
                        {activeTab === 'content' && (
                            <ContentTab app={app} />
                        )}
                        {activeTab === 'interviews' && (
                            <InterviewsTab app={app} onUpdateDetails={onUpdateDetails} />
                        )}
                    </div>

                    {/* Persistent Footer */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                        <button
                            className="px-4 py-2 text-red-400/70 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-base font-medium flex items-center gap-2"
                            onClick={(e) => { e.stopPropagation(); onDelete(app); }}
                        >
                            <XCircle size={16} /> Delete Application
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default React.memo(ApplicationCardComponent, (prevProps, nextProps) => {
    // Only re-render if the application JSON changes or the specific expanded state changes
    return (
        JSON.stringify(prevProps.app) === JSON.stringify(nextProps.app) &&
        prevProps.isExpanded === nextProps.isExpanded &&
        prevProps.activeTab === nextProps.activeTab &&
        prevProps.isAnalyzing === nextProps.isAnalyzing
    );
});
