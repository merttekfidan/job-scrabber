'use client';

import React, { useState } from 'react';
import {
    MapPin, Banknote, Calendar, Briefcase, ExternalLink, Globe, Building,
    CheckCircle, AlertCircle, Sparkles, BrainCircuit, Layers, ArrowLeft, PenTool, Plus
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { formatSalary } from '@/lib/currencyUtils';
import { InterviewProgress } from '@/components/dashboard/VisualFrameworks';

export default function ApplicationDetailClient({ initialApp, isShared = false }) {
    const [app, setApp] = useState(initialApp);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleUpdateDetails = async (updates) => {
        if (isShared) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/update-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: app.id, updates })
            });
            if (res.ok) {
                setApp(prev => ({ ...prev, ...updates }));
                showToast('Updated successfully');
            } else {
                showToast('Failed to update', 'error');
            }
        } catch (error) {
            showToast('Error', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const parseJson = (jsonString) => {
        try { return JSON.parse(jsonString) || []; }
        catch (e) { return []; }
    };

    const insights = app.personalized_analysis?.companyInsights || null;
    const swot = app.personalized_analysis?.swot || null;
    const prep = typeof app.interview_prep_notes === 'string'
        ? parseJson(app.interview_prep_notes)
        : app.interview_prep_notes || {};

    const hiringManager = typeof app.hiring_manager === 'string' ? parseJson(app.hiring_manager) : app.hiring_manager || {};
    const companyInfo = typeof app.company_info === 'string' ? parseJson(app.company_info) : app.company_info || {};

    return (
        <div className="min-h-screen bg-[#0f1117] text-gray-300 font-sans selection:bg-blue-500/30 pb-20 relative">

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

            {/* Navigation Bar */}
            <div className="border-b border-gray-800 bg-[#0f1117]/80 backdrop-blur sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {!isShared ? (
                            <Link href="/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                                <ArrowLeft size={18} /> Back to Dashboard
                            </Link>
                        ) : (
                            <div className="font-bold text-white tracking-tight flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">JS</div>
                                Job Scrabber <span className="text-gray-500 font-normal ml-2 text-sm border-l border-gray-700 pl-3">Mentorship View</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Hero Header Card */}
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row gap-6 items-start justify-between mb-8">
                            <div className="flex items-start gap-6">
                                <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 font-bold text-4xl shadow-inner border border-white/10 shrink-0 capitalize">
                                    {app.company.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">{app.job_title}</h1>
                                    <div className="text-xl text-blue-400 font-medium flex items-center gap-2">
                                        <Building size={20} /> {app.company}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 shrink-0">
                                {app.job_url && (
                                    <a href={app.job_url} target="_blank" rel="noopener noreferrer"
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/30 font-medium flex items-center justify-center gap-2 cursor-pointer">
                                        View Job Post <ExternalLink size={16} />
                                    </a>
                                )}
                                {!isShared && (
                                    <select
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                                        value={app.status}
                                        onChange={(e) => handleUpdateDetails({ status: e.target.value })}
                                        disabled={isSaving}
                                    >
                                        <option value="Applied">Applied</option>
                                        <option value="Interview Scheduled">Interview Scheduled</option>
                                        <option value="Offer Received">Offer Received</option>
                                        <option value="Rejected">Rejected</option>
                                        <option value="Withdrawn">Withdrawn</option>
                                    </select>
                                )}
                                {isShared && (
                                    <div className="px-5 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-xl font-medium text-center">
                                        Status: {app.status}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><MapPin size={12} /> Location</div>
                                <div className="text-white font-medium truncate">{app.location || 'Remote'}</div>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><Banknote size={12} /> Salary</div>
                                <div className="text-white font-medium truncate">{app.salary ? formatSalary(app.salary, app.location) : 'N/A'}</div>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><Briefcase size={12} /> Work Mode</div>
                                <div className="text-white font-medium truncate">{app.work_mode || 'Full-time'}</div>
                            </div>
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><Calendar size={12} /> Applied On</div>
                                <div className="text-white font-medium truncate">{formatDate(app.application_date)}</div>
                            </div>

                            {/* New Company Info Box */}
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-sm col-span-2 lg:col-span-1">
                                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><Globe size={12} /> Industry/Size</div>
                                <div className="text-white font-medium truncate">{companyInfo?.industry || 'Unknown Sector'}</div>
                                <div className="text-gray-400 text-xs mt-1 truncate">{companyInfo?.size || 'Unknown Size'} • {companyInfo?.fundingStage || 'Unknown Funding'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Hiring Manager Card */}
                        {hiringManager?.name && hiringManager.name !== 'If mentioned or visible on the page' && (
                            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 border border-blue-500/30">
                                        <Briefcase size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{hiringManager.name}</h3>
                                        <p className="text-blue-300 text-sm">{hiringManager.title || 'Hiring Manager'}</p>
                                    </div>
                                </div>
                                {hiringManager.linkedinUrl && hiringManager.linkedinUrl !== 'If available' && (
                                    <a href={hiringManager.linkedinUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg text-sm font-medium transition-colors">
                                        LinkedIn
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Interview Timeline */}
                        <div className="bg-gray-800/20 border border-gray-700/50 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Calendar className="text-blue-400" /> Interview Timeline
                                </h3>
                                {!isShared && (
                                    <button
                                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                        onClick={() => {
                                            const currentStages = parseJson(app.interview_stages);
                                            const newStage = {
                                                id: Date.now(),
                                                round: `Round ${currentStages.length + 1}`,
                                                date: new Date().toISOString().split('T')[0],
                                                type: 'Screening',
                                                notes: ''
                                            };
                                            handleUpdateDetails({ interview_stages: [...currentStages, newStage] });
                                        }}
                                        disabled={isSaving}
                                    >
                                        <Plus size={14} /> Add Round
                                    </button>
                                )}
                            </div>

                            <div className="mb-8">
                                <InterviewProgress stages={parseJson(app.interview_stages)} currentStatus={app.status} />
                            </div>

                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
                                {parseJson(app.interview_stages).length === 0 ? (
                                    <div className="text-gray-500 text-center py-4 relative z-10 bg-[#0f1117]/80 rounded-xl">No interviews scheduled yet.</div>
                                ) : (
                                    parseJson(app.interview_stages).map((stage, idx) => (
                                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Milestone */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-700 bg-gray-900 text-slate-400 shrink-0 md:order-1 md:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors">
                                                <span className="text-sm font-bold">{idx + 1}</span>
                                            </div>
                                            {/* Content */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-700/50 bg-gray-800/40 shadow-sm transition-all hover:bg-gray-800/60 group-odd:md:ml-auto">
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        {!isShared ? (
                                                            <div className="flex items-center gap-2 w-full">
                                                                <input
                                                                    type="text"
                                                                    className="bg-transparent font-bold text-white border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:outline-none w-1/3 text-sm px-1 py-0.5 transition-colors"
                                                                    value={stage.round || ''}
                                                                    onChange={(e) => {
                                                                        const updated = [...parseJson(app.interview_stages)];
                                                                        updated[idx].round = e.target.value;
                                                                        setApp({ ...app, interview_stages: JSON.stringify(updated) });
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        const updated = [...parseJson(app.interview_stages)];
                                                                        updated[idx].round = e.target.value;
                                                                        handleUpdateDetails({ interview_stages: updated });
                                                                    }}
                                                                />
                                                                <input
                                                                    type="date"
                                                                    className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-blue-400 focus:outline-none focus:border-blue-500 w-1/3"
                                                                    value={stage.date || ''}
                                                                    onChange={(e) => {
                                                                        const updated = [...parseJson(app.interview_stages)];
                                                                        updated[idx].date = e.target.value;
                                                                        handleUpdateDetails({ interview_stages: updated });
                                                                    }}
                                                                />
                                                                <button
                                                                    className="text-gray-500 hover:text-red-400 p-1 ml-auto"
                                                                    onClick={() => {
                                                                        const updated = [...parseJson(app.interview_stages)];
                                                                        updated.splice(idx, 1);
                                                                        handleUpdateDetails({ interview_stages: updated });
                                                                    }}
                                                                >
                                                                    <AlertCircle size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <h4 className="font-bold text-white">{stage.round}</h4>
                                                                <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{formatDate(stage.date)}</span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {!isShared ? (
                                                        <textarea
                                                            placeholder="Interview notes, technical questions asked, impressions..."
                                                            className="w-full bg-black/20 border border-gray-700/50 rounded-lg p-3 text-sm text-gray-300 min-h-[80px] focus:outline-none focus:border-blue-500 transition-colors"
                                                            value={stage.notes || ''}
                                                            onChange={(e) => {
                                                                const updated = [...parseJson(app.interview_stages)];
                                                                updated[idx].notes = e.target.value;
                                                                setApp({ ...app, interview_stages: JSON.stringify(updated) });
                                                            }}
                                                            onBlur={(e) => {
                                                                const updated = [...parseJson(app.interview_stages)];
                                                                updated[idx].notes = e.target.value;
                                                                handleUpdateDetails({ interview_stages: updated });
                                                            }}
                                                        />
                                                    ) : (
                                                        stage.notes && (
                                                            <div className="text-sm text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                                                                {stage.notes}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Personal Notes */}
                        <div className="bg-gray-800/20 border border-gray-700/50 rounded-2xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <PenTool className="text-orange-400" /> General Notes
                            </h3>
                            {!isShared ? (
                                <textarea
                                    className="w-full h-32 bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-gray-300 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all resize-none"
                                    placeholder="Jot down your thoughts, impressions, or next steps..."
                                    value={prep.generalNotes || ''}
                                    onChange={(e) => {
                                        // Update local state without saving immediately
                                        const newPrep = { ...prep, generalNotes: e.target.value };
                                        setApp({ ...app, interview_prep_notes: JSON.stringify(newPrep) });
                                    }}
                                    onBlur={(e) => {
                                        const newPrep = { ...prep, generalNotes: e.target.value };
                                        handleUpdateDetails({ interview_prep_notes: newPrep });
                                    }}
                                />
                            ) : (
                                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-gray-300 min-h-[100px] whitespace-pre-wrap">
                                    {prep.generalNotes || 'No notes available.'}
                                </div>
                            )}
                        </div>

                        {/* Company Insights */}
                        {insights && (
                            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
                                <h3 className="text-indigo-400 font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
                                    <Globe size={20} /> Company Strategic Focus
                                </h3>
                                <p className="text-gray-300 leading-relaxed relative z-10 text-lg">
                                    {insights.strategicFocus}
                                </p>
                            </div>
                        )}

                        {/* SWOT Analysis */}
                        {swot && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <BrainCircuit className="text-purple-400" /> Candidate Gap Analysis (SWOT)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-green-500/5 border border-green-500/10 p-5 rounded-2xl">
                                        <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2 border-b border-green-500/10 pb-2">
                                            <CheckCircle size={16} /> Strengths
                                        </h4>
                                        <ul className="space-y-2">
                                            {parseJson(swot.strengths).map((s, i) => (
                                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                    <span className="text-green-500/50 mt-1.5 min-w-[6px] h-[6px] rounded-full bg-green-500 block"></span>
                                                    <span className="leading-snug">{s}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl">
                                        <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2 border-b border-red-500/10 pb-2">
                                            <AlertCircle size={16} /> Gaps / Weaknesses
                                        </h4>
                                        <ul className="space-y-2">
                                            {parseJson(swot.weaknesses).map((s, i) => (
                                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                                    <span className="text-red-500/50 mt-1.5 min-w-[6px] h-[6px] rounded-full bg-red-500 block"></span>
                                                    <span className="leading-snug">{s}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Job Description */}
                        <div className="bg-gray-800/20 border border-gray-700/50 rounded-2xl p-8">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Layers className="text-blue-400" /> Job Description
                            </h3>
                            <div className="prose prose-invert prose-blue max-w-none text-gray-300 prose-headings:text-gray-100 prose-a:text-blue-400">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {app.formatted_content || app.original_content || app.company_description || 'No description available.'}
                                </ReactMarkdown>
                            </div>
                        </div>

                    </div>

                    {/* Right Column (1/3) */}
                    <div className="space-y-6">

                        {/* Tech Stack */}
                        {prep.techStackToStudy && prep.techStackToStudy.length > 0 && (
                            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Sparkles size={18} className="text-yellow-400" /> Tech Stack
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {prep.techStackToStudy.map((tech, i) => (
                                        <span key={i} className="px-3 py-1 bg-yellow-400/10 text-yellow-200 border border-yellow-400/20 rounded-lg text-sm font-medium">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Required Skills */}
                        <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Required Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {parseJson(app.required_skills).map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg text-sm font-medium">
                                        {skill}
                                    </span>
                                ))}
                                {parseJson(app.required_skills).length === 0 && <span className="text-gray-500 italic text-sm">No specific skills listed.</span>}
                            </div>
                        </div>

                        {/* Negative Signals */}
                        {parseJson(app.negative_signals).length > 0 && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                                    <AlertCircle size={18} /> Red Flags
                                </h3>
                                <ul className="space-y-3">
                                    {parseJson(app.negative_signals).map((signal, idx) => (
                                        <li key={idx} className="flex gap-2 text-red-200/80 text-sm">
                                            <span className="text-red-500 font-bold">•</span>
                                            <span className="leading-snug">{signal}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}
