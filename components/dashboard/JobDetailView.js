'use client';

import React, { useState } from 'react';
import {
    ArrowLeft, MapPin, DollarSign, Calendar, Building2,
    ExternalLink, XCircle, Briefcase, Globe, Clock
} from 'lucide-react';
import { parseJson, formatDate, getStatusClass } from './utils';
import { formatSalary } from '@/lib/currencyUtils';
import OverviewPanel from './OverviewPanel';
import PrepPanel from './PrepPanel';
import NotesPanel from './NotesPanel';

export default function JobDetailView({
    app,
    onBack,
    onUpdateDetails,
    onAnalyzeJob,
    onGenerateInsights,
    onShare,
    onDelete,
    isAnalyzing,
}) {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Briefcase },
        { id: 'prep', label: 'Interview Prep', icon: Clock },
    ];

    return (
        <div className="min-h-screen">
            {/* ── Top Bar ── */}
            <div className="sticky top-0 z-20 bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-white/5">
                <div className="container flex items-center justify-between py-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-base font-medium group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Pipeline
                    </button>

                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold text-white truncate max-w-[400px]">{app.job_title}</h1>
                        <span className={`status-badge ${getStatusClass(app.status)}`}>{app.status}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {app.job_url && (
                            <a
                                href={app.job_url}
                                target="_blank"
                                className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                title="Open job posting"
                            >
                                <ExternalLink size={16} />
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 3-Panel Layout ── */}
            <div className="container py-6">
                <div className="grid grid-cols-12 gap-6">

                    {/* ── Left Sidebar: Job Metadata ── */}
                    <div className="col-span-12 lg:col-span-3">
                        <div className="sticky top-20 space-y-4">
                            {/* Company Card */}
                            <div className="glass-card p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xl">
                                        {app.company?.charAt(0) || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-white text-base truncate">{app.company}</h3>
                                        {app.company_url && (
                                            <a href={app.company_url} target="_blank" className="text-blue-400 hover:underline text-base flex items-center gap-1">
                                                <Globe size={10} /> Website
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {app.salary && (
                                        <div className="flex items-center gap-2 text-base">
                                            <DollarSign size={14} className="text-emerald-400 flex-shrink-0" />
                                            <span className="text-emerald-300 font-medium text-base">{app.salary}</span>
                                        </div>
                                    )}
                                    {app.location && (
                                        <div className="flex items-center gap-2 text-base">
                                            <MapPin size={14} className="text-blue-400 flex-shrink-0" />
                                            <span className="text-gray-300 text-base">{app.location}</span>
                                        </div>
                                    )}
                                    {app.work_mode && (
                                        <div className="flex items-center gap-2 text-base">
                                            <Building2 size={14} className="text-purple-400 flex-shrink-0" />
                                            <span className="text-gray-300 text-base">{app.work_mode}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-base">
                                        <Calendar size={14} className="text-gray-500 flex-shrink-0" />
                                        <span className="text-gray-500 text-base">{formatDate(app.application_date || app.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Selector */}
                            <div className="glass-card p-4">
                                <label className="label-uppercase mb-2 block">Status</label>
                                <select
                                    className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-base focus:ring-1 focus:ring-indigo-500/50 outline-none"
                                    value={app.status}
                                    onChange={(e) => onUpdateDetails(app.id, { status: e.target.value })}
                                >
                                    <option value="Applied">Applied</option>
                                    <option value="Interview Scheduled">Interview Scheduled</option>
                                    <option value="Offer Received">Offer Received</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Withdrawn">Withdrawn</option>
                                    <option value="Accepted">Accepted</option>
                                </select>
                            </div>

                            {/* Skills Preview */}
                            {parseJson(app.required_skills).length > 0 && (
                                <div className="glass-card p-4">
                                    <label className="label-uppercase mb-2 block">Top Skills</label>
                                    <div className="flex flex-wrap gap-1">
                                        {parseJson(app.required_skills).slice(0, 6).map((skill, i) => (
                                            <span key={i} className="px-2 py-0.5 text-[10px] rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 truncate max-w-[120px]" title={skill}>{skill}</span>
                                        ))}
                                        {parseJson(app.required_skills).length > 6 && (
                                            <span className="text-[10px] text-gray-600">+{parseJson(app.required_skills).length - 6}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Delete */}
                            <button
                                onClick={() => onDelete(app)}
                                className="w-full px-4 py-2.5 text-red-400/60 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-all text-base font-medium flex items-center justify-center gap-2 border border-transparent hover:border-red-500/20"
                            >
                                <XCircle size={14} /> Delete Application
                            </button>
                        </div>
                    </div>

                    {/* ── Center: Main Content ── */}
                    <div className="col-span-12 lg:col-span-6">
                        {/* Tabs */}
                        <div className="flex gap-1 mb-6 bg-gray-900/40 rounded-lg p-1 sticky top-16 z-10 backdrop-blur-md">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-base font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-white/10 text-white shadow-lg'
                                            : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="glass-card p-6">
                            {activeTab === 'overview' && (
                                <OverviewPanel
                                    app={app}
                                    isAnalyzing={isAnalyzing}
                                    onGenerateInsights={onGenerateInsights}
                                    onShare={onShare}
                                />
                            )}
                            {activeTab === 'prep' && (
                                <PrepPanel
                                    app={app}
                                    isAnalyzing={isAnalyzing}
                                    onAnalyzeJob={onAnalyzeJob}
                                    onUpdateDetails={onUpdateDetails}
                                />
                            )}
                        </div>
                    </div>

                    {/* ── Right Sidebar: Notes ── */}
                    <div className="col-span-12 lg:col-span-3">
                        <div className="sticky top-20">
                            <div className="glass-card p-5">
                                <NotesPanel app={app} onUpdateDetails={onUpdateDetails} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
