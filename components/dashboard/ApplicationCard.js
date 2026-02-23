'use client';

import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Search, X, ChevronDown,
    Briefcase, MapPin, DollarSign, Banknote, Calendar, Building2,
    ExternalLink, CheckCircle, XCircle,
    AlertCircle, AlertTriangle, User, Sparkles, Share2,
    GraduationCap, MessageSquare, Bot, FileText, Users
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseJson, formatDate, getStatusClass } from './utils';
import { MatchScoreGauge, SkillGapBars, InterviewProgress } from './VisualFrameworks';
import HiringFrameworks from './HiringFrameworks';
import { InterviewQuestionsList, QuestionsToAskList, RedFlagsList, QuickReferenceCard } from './InterviewPrepTools';
import { formatSalary } from '@/lib/currencyUtils';

// ─── Sub-components ────────────────────────────────────────────

function StageNoteEditor({ initialNotes, onSave }) {
    const [notes, setNotes] = useState(initialNotes || '');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNotes(initialNotes || '');
        setIsDirty(false);
    }, [initialNotes]);

    return (
        <div className="p-3 flex flex-col gap-2">
            <textarea
                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-sm text-gray-300 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-24"
                placeholder="Interview notes..."
                value={notes}
                onClick={e => e.stopPropagation()}
                onChange={(e) => { setNotes(e.target.value); setIsDirty(true); }}
            />
            {isDirty && (
                <div className="flex justify-end gap-2">
                    <span className="text-xs text-amber-400 self-center">Unsaved changes</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSave(notes); setIsDirty(false); }}
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
                        onClick={(e) => { e.stopPropagation(); handleSave(); }}
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
                onChange={(e) => { setNotes(e.target.value); setIsDirty(true); }}
            />
        </div>
    );
}

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
                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
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
                            className="px-4 py-2 text-red-400/70 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
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

// ─── Tab Components ────────────────────────────────────────────

function CompanyTab({ app, isAnalyzing, onGenerateInsights, onShare }) {
    const insights = app.personalized_analysis?.companyInsights;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Company Intelligence</h3>
                <div className="flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onShare(app.id); }}
                        className="btn btn-sm bg-gray-700 hover:bg-gray-600 border-none text-gray-300 transition-colors"
                        title="Copy Public Share Link"
                    >
                        <Share2 size={14} className="mr-2" /> Share
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onGenerateInsights(app.id); }}
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
                            onClick={(e) => { e.stopPropagation(); onGenerateInsights(app.id); }}
                            disabled={isAnalyzing}
                            className="btn btn-primary btn-sm mx-auto"
                        >
                            {isAnalyzing ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
                            Generate Company Insights
                        </button>
                    </div>
                )}
            </div>

            {insights && (
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
                        {insights.salaryContext && (
                            <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20">
                                <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                                    💰 Salary Intelligence
                                </h4>
                                {typeof insights.salaryContext === 'object' ? (
                                    <div className="space-y-2">
                                        {insights.salaryContext.range && <div className="flex items-center gap-2 text-sm"><span className="text-gray-500 font-medium w-24">Range:</span><span className="text-white font-semibold">{insights.salaryContext.range}</span></div>}
                                        {insights.salaryContext.confidence && <div className="flex items-center gap-2 text-sm"><span className="text-gray-500 font-medium w-24">Confidence:</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${insights.salaryContext.confidence === 'high' ? 'bg-green-500/20 text-green-400' : insights.salaryContext.confidence === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700 text-gray-400'}`}>{insights.salaryContext.confidence}</span></div>}
                                        {insights.salaryContext.source && <div className="flex items-center gap-2 text-sm"><span className="text-gray-500 font-medium w-24">Source:</span><span className="text-gray-400 text-xs">{insights.salaryContext.source}</span></div>}
                                    </div>
                                ) : (
                                    <p className="text-gray-300 text-sm leading-relaxed">{insights.salaryContext}</p>
                                )}
                            </div>
                        )}

                        {/* Hiring Urgency — compact with signals as tags */}
                        {insights.hiringUrgency && (
                            <div className={`p-4 rounded-2xl border flex flex-wrap items-center gap-3 ${insights.hiringUrgency.level === 'High' ? 'bg-red-500/10 border-red-500/20' :
                                insights.hiringUrgency.level === 'Medium' ? 'bg-amber-500/10 border-amber-500/20' :
                                    'bg-gray-800/50 border-gray-700/50'
                                }`}>
                                <h4 className={`font-bold text-sm ${insights.hiringUrgency.level === 'High' ? 'text-red-400' :
                                    insights.hiringUrgency.level === 'Medium' ? 'text-amber-400' : 'text-gray-400'
                                    }`}>⏰ Hiring Urgency</h4>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${insights.hiringUrgency.level === 'High' ? 'bg-red-500/20 text-red-400' :
                                    insights.hiringUrgency.level === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-gray-700 text-gray-400'
                                    }`}>{insights.hiringUrgency.level}</span>
                                {insights.hiringUrgency.signals?.map((s, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-gray-900/40 text-gray-400 text-[10px] rounded">{s}</span>
                                ))}
                            </div>
                        )}

                        {/* Remote Policy — one-liner */}
                        {insights.remotePolicy && (
                            <div className="bg-cyan-500/10 p-4 rounded-2xl border border-cyan-500/20 flex flex-wrap items-center gap-3">
                                <h4 className="text-cyan-400 font-bold text-sm">🏠 Remote Policy</h4>
                                <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-bold">{insights.remotePolicy.type}</span>
                                <span className="text-gray-400 text-sm">{insights.remotePolicy.details}</span>
                            </div>
                        )}

                        {/* Competitor Context */}
                        {insights.competitorContext && (
                            <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700/50">
                                <h4 className="text-violet-400 font-bold mb-3">🏁 Competitive Landscape</h4>
                                {insights.competitorContext.likelyCompetitors?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {insights.competitorContext.likelyCompetitors.map((c, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-lg border border-violet-500/20">{c}</span>
                                        ))}
                                    </div>
                                )}
                                {insights.competitorContext.differentiator && (
                                    <p className="text-gray-400 text-sm italic">✦ {insights.competitorContext.differentiator}</p>
                                )}
                            </div>
                        )}

                        {/* Culture Signals — enriched with evidence */}
                        {insights.cultureSignals?.length > 0 && (
                            <div className="bg-gray-800/30 p-5 rounded-2xl border border-gray-700/50">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Culture Signal Ratings</h4>
                                <div className="space-y-3">
                                    {insights.cultureSignals.map((cs, i) => (
                                        <div key={i}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-200 w-40 truncate font-medium" title={cs.signal}>{cs.signal}</span>
                                                <div className="flex-1 h-2.5 bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                                        style={{ width: `${(cs.rating / 5) * 100}%`, transition: 'width 0.8s ease' }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-gray-500 w-6 text-right">{cs.rating}/5</span>
                                            </div>
                                            {cs.evidence && (
                                                <p className="text-[11px] text-gray-500 mt-1 ml-1 italic truncate" title={cs.evidence}>📌 {cs.evidence}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function NotesTab({ app, onUpdateDetails }) {
    return (
        <div className="h-full">
            <GeneralNoteEditor
                initialNotes={(() => {
                    const prep = typeof app.interview_prep_notes === 'string'
                        ? parseJson(app.interview_prep_notes)
                        : app.interview_prep_notes || {};
                    return prep.generalNotes || '';
                })()}
                onSave={async (newNotes) => {
                    let currentPrep = {};
                    if (typeof app.interview_prep_notes === 'string') {
                        currentPrep = parseJson(app.interview_prep_notes) || {};
                    } else if (app.interview_prep_notes) {
                        currentPrep = app.interview_prep_notes;
                    }

                    const updatedPrep = {
                        keyTalkingPoints: [],
                        questionsToAsk: [],
                        potentialRedFlags: [],
                        techStackToStudy: [],
                        ...currentPrep,
                        generalNotes: newNotes
                    };
                    await onUpdateDetails(app.id, { interview_prep_notes: updatedPrep });
                }}
            />
        </div>
    );
}

function CoachTab({ app, isAnalyzing, onAnalyzeJob, onUpdateDetails }) {
    if (!app.personalized_analysis) {
        return (
            <div className="bg-gray-800/30 p-8 rounded-2xl border border-dashed border-gray-700 text-center">
                <Sparkles className="mx-auto mb-4 text-purple-400 animate-pulse" size={40} />
                <h3 className="text-xl font-bold text-white mb-2">Personalized AI Advice</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Cross-reference this job with your active CV to get a SWOT analysis and tailored interview talking points.
                </p>
                <button
                    className="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none shadow-lg shadow-purple-900/20"
                    onClick={(e) => { e.stopPropagation(); onAnalyzeJob(app.id); }}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? (
                        <><RefreshCw size={18} className="animate-spin mr-2" /> Analyzing CV & Job...</>
                    ) : (
                        'Generate Personalized Insights'
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Match Score + Skill Gap Visualization */}
            {app.personalized_analysis.swot?.matchScore != null && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div className="flex justify-center">
                        <MatchScoreGauge score={app.personalized_analysis.swot.matchScore} />
                    </div>
                    <div className="md:col-span-2">
                        <SkillGapBars
                            strengths={parseJson(app.personalized_analysis.swot?.strengths)}
                            weaknesses={parseJson(app.personalized_analysis.swot?.weaknesses)}
                        />
                    </div>
                </div>
            )}

            {/* SWOT Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SwotQuadrant color="green" icon={<CheckCircle size={18} />} title="Strengths" items={parseJson(app.personalized_analysis.swot?.strengths)} />
                <SwotQuadrant color="red" icon={<AlertCircle size={18} />} title="Gaps / Weaknesses" items={parseJson(app.personalized_analysis.swot?.weaknesses)} />
                <SwotQuadrant color="blue" icon={<Sparkles size={18} />} title="Opportunities" items={parseJson(app.personalized_analysis.swot?.opportunities)} />
                <SwotQuadrant color="amber" icon={<XCircle size={18} />} title="Risks / Threats" items={parseJson(app.personalized_analysis.swot?.threats)} />
            </div>

            {/* Coaching Strategy */}
            <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl">
                <h4 className="text-purple-400 font-bold mb-4 flex items-center gap-2 text-lg">
                    <User size={20} /> Career Coach&apos;s Strategy
                </h4>
                {app.personalized_analysis.prep?.tailoredAdvice && (
                    <p className="text-gray-300 text-sm leading-relaxed mb-5">
                        {app.personalized_analysis.prep.tailoredAdvice}
                    </p>
                )}
                <div className="space-y-3">
                    <h5 className="text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span> Key Action Items
                    </h5>
                    <div className="grid grid-cols-1 gap-2">
                        {parseJson(app.personalized_analysis.prep?.keyTalkingPoints).map((tp, i) => (
                            <details key={i} className="group bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                                <summary className="flex items-start gap-3 p-3 cursor-pointer list-none select-none hover:bg-gray-800/60 transition-colors">
                                    <span className="text-purple-400 font-bold text-sm mt-0.5 w-5 text-center shrink-0">
                                        <span className="block group-open:hidden">+</span>
                                        <span className="hidden group-open:block">−</span>
                                    </span>
                                    <span className="text-sm font-medium text-white leading-relaxed">{tp.point}</span>
                                </summary>
                                {tp.explanation && (
                                    <div className="px-3 pb-3 pl-11 text-gray-400 text-xs leading-relaxed">
                                        {tp.explanation}
                                    </div>
                                )}
                            </details>
                        ))}
                    </div>
                </div>
            </div>

            {/* Interview Cheat Sheet */}
            <div className="relative bg-amber-500/5 border-2 border-dashed border-amber-500/30 p-6 rounded-2xl" style={{ fontFamily: "'Caveat', cursive" }}>
                <div className="absolute -top-3 left-4 bg-gray-900 px-3 py-0.5 rounded-full">
                    <span className="text-amber-400 text-xs font-bold tracking-wider uppercase" style={{ fontFamily: 'inherit' }}>📋 Quick Cheat Sheet</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <h5 className="text-amber-400 font-bold text-sm mb-2" style={{ fontFamily: 'system-ui' }}>🎯 Lead With</h5>
                        <ul className="space-y-1">
                            {parseJson(app.personalized_analysis.swot?.strengths).slice(0, 3).map((s, i) => (
                                <li key={i} className="text-xs text-gray-300 flex gap-2">
                                    <span className="text-green-400 shrink-0">✓</span>
                                    <span className="line-clamp-1" style={{ fontFamily: 'system-ui' }}>{typeof s === 'string' ? s.split('→')[0].replace('CV:', '').trim() : s}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-amber-400 font-bold text-sm mb-2" style={{ fontFamily: 'system-ui' }}>💬 Key Points</h5>
                        <ul className="space-y-1">
                            {parseJson(app.personalized_analysis.prep?.keyTalkingPoints).slice(0, 3).map((tp, i) => (
                                <li key={i} className="text-xs text-gray-300 flex gap-2">
                                    <span className="text-purple-400 shrink-0">→</span>
                                    <span className="line-clamp-1" style={{ fontFamily: 'system-ui' }}>{tp.point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {app.personalized_analysis.swot?.matchScore != null && (
                    <div className="mt-3 flex items-center gap-2 pt-3 border-t border-amber-500/20">
                        <span className="text-xs text-gray-500" style={{ fontFamily: 'system-ui' }}>Match Score:</span>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full" style={{ width: `${app.personalized_analysis.swot.matchScore}%`, transition: 'width 0.8s ease' }} />
                        </div>
                        <span className="text-xs font-bold text-amber-400" style={{ fontFamily: 'system-ui' }}>{app.personalized_analysis.swot.matchScore}%</span>
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-500 px-2">
                <span>Analyzed using CV: {app.personalized_analysis.cvFilename}</span>
                <button
                    className="hover:text-purple-400 transition-colors underline"
                    onClick={(e) => { e.stopPropagation(); onAnalyzeJob(app.id); }}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? 'Re-analyzing...' : 'Refresh Analysis'}
                </button>
            </div>

            <HiringFrameworks
                appId={app.id}
                existingData={app.personalized_analysis?.hiringFrameworks}
                onDataUpdate={(framework, data) => {
                    const currentAnalysis = app.personalized_analysis || {};
                    const updatedHF = { ...(currentAnalysis.hiringFrameworks || {}), [framework]: { data, generatedAt: new Date().toISOString() } };
                    onUpdateDetails(app.id, { personalized_analysis: { ...currentAnalysis, hiringFrameworks: updatedHF } });
                }}
            />
        </div>
    );
}

function SwotQuadrant({ color, icon, title, items }) {
    return (
        <div className={`bg-${color}-500/5 border border-${color}-500/20 p-5 rounded-2xl`}>
            <h4 className={`text-${color}-400 font-bold mb-3 flex items-center gap-2`}>
                {icon} {title}
            </h4>
            <ul className="space-y-2">
                {(items || []).map((item, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2 group/item" title={item}>
                        <span className={`text-${color}-500 mt-1 shrink-0`}>•</span>
                        <span className="line-clamp-2 group-hover/item:line-clamp-none transition-all cursor-default">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function DetailsTab({ app, onUpdateDetails, onDelete }) {
    return (
        <div className="space-y-4">
            {app.role_summary && (
                <div className="info-card">
                    <h5><Search size={12} className="inline mr-1" />Position Summary</h5>
                    <p>{app.role_summary}</p>
                </div>
            )}

            {(() => {
                const negativeSignals = parseJson(app.negative_signals);
                if (negativeSignals && negativeSignals.length > 0) {
                    return (
                        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                            <div className="flex items-center gap-1.5 mb-2">
                                <AlertTriangle size={14} className="text-red-400" />
                                <span className="label-uppercase" style={{ color: '#ef4444' }}>Red Flags</span>
                            </div>
                            <ul className="space-y-1">
                                {negativeSignals.map((signal, idx) => (
                                    <li key={idx} className="text-xs text-red-300/80">{signal}</li>
                                ))}
                            </ul>
                        </div>
                    );
                }
                return null;
            })()}

            <div className="grid grid-cols-2 gap-4">
                <div className="info-card">
                    <h5>Status</h5>
                    <select
                        className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-indigo-500/50 outline-none"
                        value={app.status}
                        onClick={e => e.stopPropagation()}
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
                <div className="info-card">
                    <h5>Salary</h5>
                    <div className="text-lg font-medium text-white">{app.salary || 'Not listed'}</div>
                </div>
            </div>

            <div>
                <h4 className="label-uppercase mb-3">Responsibilities</h4>
                <ul className="space-y-1.5">
                    {parseJson(app.key_responsibilities).map((item, index) => (
                        <li key={index} className="text-sm text-white/80 flex items-start gap-2">
                            <span className="text-indigo-400 mt-0.5">•</span>{item}
                        </li>
                    ))}
                    {parseJson(app.key_responsibilities).length === 0 && (
                        <p className="text-gray-500 italic text-sm">No responsibilities extracted.</p>
                    )}
                </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h4 className="label-uppercase mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {parseJson(app.required_skills).map((skill, index) => (
                            <span key={index} className="px-2 py-0.5 text-[10px] rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{skill}</span>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="label-uppercase mb-2">Preferred Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {parseJson(app.preferred_skills).map((skill, index) => (
                            <span key={index} className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{skill}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PrepTab({ app }) {
    const prep = typeof app.interview_prep_notes === 'string'
        ? parseJson(app.interview_prep_notes)
        : app.interview_prep_notes || {};
    const talkingPoints = parseJson(app.interview_prep_key_talking_points);
    const questionsRaw = parseJson(app.interview_prep_questions_to_ask);
    const redFlagsRaw = parseJson(app.interview_prep_potential_red_flags);
    const likelyQuestions = prep.likelyInterviewQuestions || [];

    const personalAnalysis = app.personalized_analysis;
    const hasPersonalized = !!personalAnalysis;

    return (
        <div className="space-y-8">
            {/* ── 1. Role Snapshot ────────────────────────── */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-2xl border border-gray-700/40 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xl flex-shrink-0">
                        {app.company?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-1">{app.job_title}</h3>
                        <p className="text-sm text-gray-400">{app.company}</p>
                        {app.role_summary && (
                            <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                                <span className="text-blue-400 font-semibold">The Problem:</span> {app.role_summary}
                            </p>
                        )}
                        {hasPersonalized && personalAnalysis.prep?.tailoredAdvice && (
                            <p className="text-sm text-emerald-300/80 mt-2 leading-relaxed italic">
                                <span className="text-emerald-400 font-semibold not-italic">Your Positioning:</span> {personalAnalysis.prep.tailoredAdvice}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700/30">
                    {app.salary && (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium border border-emerald-500/15">💰 {app.salary}</span>
                    )}
                    {app.location && (
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/15">📍 {app.location}</span>
                    )}
                    {app.work_mode && (
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-medium border border-purple-500/15">🏢 {app.work_mode}</span>
                    )}
                </div>
            </div>

            {/* ── 2. Key Talking Points (compact) ────────── */}
            {talkingPoints.length > 0 && (
                <div>
                    <h3 className="text-base font-bold text-amber-400 mb-4 flex items-center gap-2">
                        <span className="p-1.5 bg-amber-500/10 rounded-lg">💡</span> Key Talking Points
                    </h3>
                    <div className="space-y-2">
                        {talkingPoints.map((item, i) => {
                            const isObj = typeof item === 'object' && item !== null;
                            const pointText = isObj ? item.point : item;
                            const explanation = isObj ? item.explanation : null;
                            return (
                                <details
                                    key={i}
                                    className="group bg-amber-500/5 rounded-xl border border-amber-500/10 overflow-hidden hover:bg-amber-500/8 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <summary
                                        className="flex gap-3 items-start p-3.5 cursor-pointer list-none select-none"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span className="text-amber-500 font-bold text-sm mt-0.5 w-4 text-center flex-shrink-0">
                                            <span className="block group-open:hidden">+</span>
                                            <span className="hidden group-open:block">−</span>
                                        </span>
                                        <span className="text-sm font-medium text-amber-100 leading-relaxed">{pointText}</span>
                                    </summary>
                                    {explanation && (
                                        <div className="px-3.5 pb-3.5 pl-10 text-gray-400 text-xs leading-relaxed">
                                            {explanation}
                                        </div>
                                    )}
                                </details>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── 3. Questions They'll Likely Ask You ─────── */}
            {likelyQuestions.length > 0 && (
                <div>
                    <h3 className="text-base font-bold text-blue-400 mb-4 flex items-center gap-2">
                        <span className="p-1.5 bg-blue-500/10 rounded-lg">❓</span> Questions They&apos;ll Likely Ask You
                    </h3>
                    <InterviewQuestionsList questions={likelyQuestions} />
                </div>
            )}

            {/* ── 4. Questions You Should Ask ─────────────── */}
            {questionsRaw.length > 0 && (
                <div>
                    <h3 className="text-base font-bold text-sky-400 mb-4 flex items-center gap-2">
                        <span className="p-1.5 bg-sky-500/10 rounded-lg">🙋</span> Questions You Should Ask
                    </h3>
                    <QuestionsToAskList questions={questionsRaw} />
                    {/* CV-based gap questions if available */}
                    {hasPersonalized && personalAnalysis.prep?.questionsToAsk?.length > 0 && (
                        <div className="mt-5">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">Based on Your CV</span>
                            </div>
                            <div className="space-y-2.5">
                                {personalAnalysis.prep.questionsToAsk.map((q, i) => (
                                    <div key={i} className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4">
                                        <p className="text-sm text-gray-200 font-medium leading-relaxed">{q}</p>
                                        <p className="text-xs text-gray-500 mt-1.5">→ Address potential gap between your experience and this role</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── 5. Red Flags & Things to Probe ──────────── */}
            {redFlagsRaw.length > 0 && (
                <div>
                    <h3 className="text-base font-bold text-red-400 mb-4 flex items-center gap-2">
                        <span className="p-1.5 bg-red-500/10 rounded-lg">🚩</span> Red Flags &amp; Things to Probe
                    </h3>
                    <RedFlagsList redFlags={redFlagsRaw} />
                </div>
            )}

            {/* ── 6. Quick Reference Card ─────────────────── */}
            <QuickReferenceCard
                app={app}
                talkingPoints={talkingPoints}
                questionsToAsk={questionsRaw}
            />
        </div>
    );
}

function ContentTab({ app }) {
    return (
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
    );
}

function InterviewsTab({ app, onUpdateDetails }) {
    const stages = parseJson(app.interview_stages) || [];

    return (
        <div className="space-y-6">
            <InterviewProgress stages={stages} currentStatus={app.status} />
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Interview Rounds</h3>
                    <button
                        className="btn btn-secondary btn-sm flex items-center gap-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            const currentStages = Array.isArray(stages) ? stages : [];
                            const newStage = {
                                id: Date.now(),
                                round: `Round ${currentStages.length + 1}`,
                                date: new Date().toISOString().split('T')[0],
                                type: 'Screening',
                                notes: ''
                            };
                            onUpdateDetails(app.id, { interview_stages: [...currentStages, newStage] });
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
                                                onUpdateDetails(app.id, { interview_stages: newStages });
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
                                                onUpdateDetails(app.id, { interview_stages: newStages });
                                            }}
                                        />
                                        <button
                                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Delete round?')) {
                                                    const newStages = stages.filter((_, i) => i !== idx);
                                                    onUpdateDetails(app.id, { interview_stages: newStages });
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
                                        onUpdateDetails(app.id, { interview_stages: newStages });
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
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
