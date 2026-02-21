'use client';

import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Search, X,
    Briefcase, MapPin, DollarSign, Calendar,
    ExternalLink, CheckCircle, XCircle,
    AlertCircle, User, Sparkles, Share2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseJson, formatDate, getStatusClass } from './utils';
import { MatchScoreGauge, SkillGapBars, CultureFitMeter, InterviewProgress } from './VisualFrameworks';
import HiringFrameworks from './HiringFrameworks';
import { FlashcardMode, CheatSheet, MockInterviewDrill } from './InterviewPrepTools';

// ─── Sub-components ────────────────────────────────────────────

function StageNoteEditor({ initialNotes, onSave }) {
    const [notes, setNotes] = useState(initialNotes || '');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
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

export default function ApplicationCard({
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
        <div
            className={`bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-xl p-4 cursor-pointer hover:bg-gray-800/40 hover:border-white/10 transition-all group ${isExpanded ? 'border-blue-500/30 ring-1 ring-blue-500/20' : ''}`}
            onClick={onToggleExpand}
        >
            {/* Collapsed Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-white truncate">{app.job_title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusClass(app.status)}`}>
                            {app.status}
                        </span>
                    </div>
                    <div className="text-sm text-gray-400 font-medium">{app.company}</div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-1.5"><MapPin size={14} /> {app.location || 'Remote'}</div>
                    <div className="flex items-center gap-1.5"><DollarSign size={14} /> {app.salary || 'N/A'}</div>
                    <div className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(app.application_date)}</div>
                </div>
            </div>

            {/* Skill Tags */}
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

            {/* Expanded Content */}
            {isExpanded && (
                <div className="mt-6 border-t border-gray-700/50 pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-700/50 mb-6 gap-6 overflow-x-auto">
                        {['details', 'company', 'prep', 'notes', 'coach', 'content', 'interviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={(e) => { e.stopPropagation(); onSetActiveTab(tab); }}
                                className={`pb-3 font-medium text-sm transition-colors relative capitalize ${activeTab === tab ? 'text-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
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

                    <CultureFitMeter cultureFit={insights.cultureFit} />

                    <div className="space-y-4">
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
                            <h4 className="text-green-400 font-bold mb-3">Why {app.company}?</h4>
                            <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10 text-gray-300 italic">
                                &quot;{insights.whyUsAnswer}&quot;
                            </div>
                        </div>
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
                            <h4 className="text-blue-400 font-bold mb-3">Why You?</h4>
                            <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 text-gray-300 italic">
                                &quot;{insights.whyYouAnswer}&quot;
                            </div>
                        </div>

                        {insights.salaryContext && (
                            <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20">
                                <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                                    💰 Salary Intelligence
                                </h4>
                                <p className="text-gray-300 text-sm leading-relaxed">{insights.salaryContext}</p>
                            </div>
                        )}

                        {/* Hiring Urgency */}
                        {insights.hiringUrgency && (
                            <div className={`p-5 rounded-2xl border ${insights.hiringUrgency.level === 'High' ? 'bg-red-500/10 border-red-500/20' :
                                    insights.hiringUrgency.level === 'Medium' ? 'bg-amber-500/10 border-amber-500/20' :
                                        'bg-gray-800/50 border-gray-700/50'
                                }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className={`font-bold ${insights.hiringUrgency.level === 'High' ? 'text-red-400' :
                                            insights.hiringUrgency.level === 'Medium' ? 'text-amber-400' : 'text-gray-400'
                                        }`}>⏰ Hiring Urgency</h4>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${insights.hiringUrgency.level === 'High' ? 'bg-red-500/20 text-red-400' :
                                            insights.hiringUrgency.level === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-gray-700 text-gray-400'
                                        }`}>{insights.hiringUrgency.level}</span>
                                </div>
                                {insights.hiringUrgency.signals?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {insights.hiringUrgency.signals.map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-gray-900/40 text-gray-400 text-[10px] rounded">{s}</span>
                                        ))}
                                    </div>
                                )}
                                {insights.hiringUrgency.recommendation && (
                                    <p className="text-xs text-gray-400 italic">💡 {insights.hiringUrgency.recommendation}</p>
                                )}
                            </div>
                        )}

                        {/* Remote Policy */}
                        {insights.remotePolicy && (
                            <div className="bg-cyan-500/10 p-5 rounded-2xl border border-cyan-500/20">
                                <h4 className="text-cyan-400 font-bold mb-2">🏠 Remote Work Policy</h4>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-bold">{insights.remotePolicy.type}</span>
                                </div>
                                <p className="text-gray-300 text-sm mb-1">{insights.remotePolicy.details}</p>
                                {insights.remotePolicy.flexibility && (
                                    <p className="text-xs text-gray-500 italic">{insights.remotePolicy.flexibility}</p>
                                )}
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

                        {/* Culture Signals with Ratings */}
                        {insights.cultureSignals?.length > 0 && (
                            <div className="bg-gray-800/30 p-5 rounded-2xl border border-gray-700/50">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Culture Signal Ratings</h4>
                                <div className="space-y-2.5">
                                    {insights.cultureSignals.map((cs, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="text-xs text-gray-300 w-28 truncate font-medium">{cs.signal}</span>
                                            <div className="flex-1 h-2.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                                    style={{ width: `${(cs.rating / 5) * 100}%`, transition: 'width 0.8s ease' }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-gray-500 w-6 text-right">{cs.rating}/5</span>
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
                    const currentPrep = typeof app.interview_prep_notes === 'string'
                        ? parseJson(app.interview_prep_notes)
                        : app.interview_prep_notes || {};
                    const updatedPrep = { ...currentPrep, generalNotes: newNotes };
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
                <div className="text-gray-200 leading-relaxed text-sm mb-6 bg-purple-500/5 p-4 rounded-xl italic">
                    &quot;{app.personalized_analysis.prep?.tailoredAdvice}&quot;
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
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className={`text-${color}-500 mt-1`}>•</span> {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function DetailsTab({ app, onUpdateDetails, onDelete }) {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {app.role_summary && (
                    <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Search size={12} /> Position Summary
                        </h3>
                        <p className="text-gray-300 leading-relaxed text-sm">{app.role_summary}</p>
                    </div>
                )}

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
                    onClick={(e) => { e.stopPropagation(); onDelete(app); }}
                >
                    <XCircle size={16} /> Delete Application
                </button>
            </div>
        </div>
    );
}

function PrepTab({ app }) {
    const prep = typeof app.interview_prep_notes === 'string'
        ? parseJson(app.interview_prep_notes)
        : app.interview_prep_notes || {};
    const talkingPoints = parseJson(app.interview_prep_key_talking_points);
    const questions = parseJson(app.interview_prep_questions_to_ask);
    const redFlags = parseJson(app.interview_prep_potential_red_flags);
    const techStack = prep.techStackToStudy || [];

    return (
        <div className="space-y-6">
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

            {/* Interactive Prep Tools */}
            <FlashcardMode
                talkingPoints={talkingPoints}
                questions={questions}
                skills={parseJson(app.required_skills)}
            />

            <MockInterviewDrill
                questions={questions}
                talkingPoints={talkingPoints}
            />

            <CheatSheet app={app} />
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
                            const newStage = {
                                id: Date.now(),
                                round: `Round ${stages.length + 1}`,
                                date: new Date().toISOString().split('T')[0],
                                type: 'Screening',
                                notes: ''
                            };
                            onUpdateDetails(app.id, { interview_stages: [...stages, newStage] });
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
