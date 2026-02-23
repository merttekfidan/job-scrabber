'use client';

import React, { useState } from 'react';
import {
    Search, Briefcase, Building2, ExternalLink, AlertTriangle,
    User, Sparkles, RefreshCw, Share2, ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseJson } from './utils';
import { MatchScoreGauge, SkillGapBars } from './VisualFrameworks';

export default function OverviewPanel({ app, isAnalyzing, onGenerateInsights, onShare }) {
    const insights = app.personalized_analysis?.companyInsights;
    const personalAnalysis = app.personalized_analysis;
    const [showOriginal, setShowOriginal] = useState(false);

    return (
        <div className="space-y-8">
            {/* ── Role Summary ── */}
            {app.role_summary && (
                <div className="info-card">
                    <h5 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                        <Search size={14} className="text-blue-400" /> Position Summary
                    </h5>
                    <p className="text-gray-300 text-sm leading-relaxed">{app.role_summary}</p>
                </div>
            )}

            {/* ── Red Flags ── */}
            {(() => {
                const negativeSignals = parseJson(app.negative_signals);
                if (negativeSignals && negativeSignals.length > 0) {
                    return (
                        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle size={16} className="text-red-400" />
                                <span className="text-sm font-bold text-red-400">Red Flags</span>
                            </div>
                            <ul className="space-y-1.5">
                                {negativeSignals.map((signal, idx) => (
                                    <li key={idx} className="text-sm text-red-300/80 flex items-start gap-2">
                                        <span className="text-red-500 mt-0.5">•</span>{signal}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                }
                return null;
            })()}

            {/* ── Responsibilities ── */}
            {parseJson(app.key_responsibilities).length > 0 && (
                <div>
                    <h4 className="label-uppercase mb-3">Key Responsibilities</h4>
                    <ul className="space-y-2">
                        {parseJson(app.key_responsibilities).map((item, index) => (
                            <li key={index} className="text-sm text-white/80 flex items-start gap-2">
                                <span className="text-indigo-400 mt-0.5">•</span>{item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ── Skills Grid ── */}
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <h4 className="label-uppercase mb-3">Required Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {parseJson(app.required_skills).map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{skill}</span>
                        ))}
                        {parseJson(app.required_skills).length === 0 && (
                            <span className="text-gray-600 text-sm italic">None extracted</span>
                        )}
                    </div>
                </div>
                <div>
                    <h4 className="label-uppercase mb-3">Preferred Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                        {parseJson(app.preferred_skills).map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{skill}</span>
                        ))}
                        {parseJson(app.preferred_skills).length === 0 && (
                            <span className="text-gray-600 text-sm italic">None extracted</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Company Intelligence ── */}
            <div className="border-t border-white/5 pt-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Building2 size={18} className="text-blue-400" /> Company Intel
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onShare(app.id)}
                            className="btn btn-sm bg-gray-700 hover:bg-gray-600 border-none text-gray-300 text-xs"
                        >
                            <Share2 size={12} className="mr-1.5" /> Share
                        </button>
                        <button
                            onClick={() => onGenerateInsights(app.id)}
                            disabled={isAnalyzing}
                            className="btn btn-primary btn-sm bg-indigo-600 hover:bg-indigo-500 border-none text-xs disabled:opacity-50"
                        >
                            {isAnalyzing ? <RefreshCw size={12} className="animate-spin mr-1.5" /> : <Sparkles size={12} className="mr-1.5" />}
                            {isAnalyzing ? 'Generating...' : 'Generate Insights'}
                        </button>
                    </div>
                </div>

                {/* Company Card */}
                <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700/50 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xl">
                            {app.company.charAt(0)}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">{app.company}</h4>
                            {app.company_url && (
                                <a href={app.company_url} target="_blank" className="text-blue-400 hover:underline text-xs flex items-center gap-1">
                                    Visit Website <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    </div>
                    {app.company_description && (
                        <p className="text-gray-300 text-sm leading-relaxed">{app.company_description}</p>
                    )}
                </div>

                {/* AI Insights */}
                {insights && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {insights.strategicFocus && (
                                <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                                    <h4 className="text-indigo-400 font-bold mb-2 text-sm flex items-center gap-2">
                                        <Briefcase size={14} /> Strategic Focus
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">{insights.strategicFocus}</p>
                                </div>
                            )}
                            {insights.cultureFit && (
                                <div className="bg-pink-500/10 p-4 rounded-xl border border-pink-500/20">
                                    <h4 className="text-pink-400 font-bold mb-2 text-sm flex items-center gap-2">
                                        <User size={14} /> Culture & Values
                                    </h4>
                                    <p className="text-gray-300 text-sm leading-relaxed">{insights.cultureFit}</p>
                                </div>
                            )}
                        </div>

                        {insights.salaryContext && (
                            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 mt-4">
                                <h4 className="text-emerald-400 font-bold mb-3 text-sm flex items-center gap-2">💰 Salary Intelligence</h4>
                                {typeof insights.salaryContext === 'string' ? (
                                    <p className="text-gray-300 text-sm leading-relaxed">{insights.salaryContext}</p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {insights.salaryContext.range && (
                                            <div className="flex items-center justify-between bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                                                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">Est. Range</span>
                                                <span className="text-emerald-300 font-bold text-sm">{insights.salaryContext.range}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            {insights.salaryContext.confidence && (
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${insights.salaryContext.confidence === 'high' ? 'bg-green-500/10 text-green-400 border-green-500/20' : insights.salaryContext.confidence === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                                                    {insights.salaryContext.confidence} Confidence
                                                </span>
                                            )}
                                            {insights.salaryContext.source && (
                                                <span className="text-gray-500 text-[10px] italic flex-1 truncate" title={insights.salaryContext.source}>Source: {insights.salaryContext.source}</span>
                                            )}
                                            {insights.salaryContext.marketComparison && (
                                                <span className="text-gray-500 text-[10px] italic flex-1 truncate" title={insights.salaryContext.marketComparison}>Market: {insights.salaryContext.marketComparison}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── SWOT Analysis ── */}
            {personalAnalysis && (
                <div className="border-t border-white/5 pt-8">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-400" /> SWOT Analysis
                    </h3>

                    {personalAnalysis.matchScore != null && (
                        <div className="mb-6">
                            <MatchScoreGauge score={personalAnalysis.matchScore} />
                        </div>
                    )}

                    {personalAnalysis.swot && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: 'strengths', bg: 'bg-emerald-500/5', border: 'border-emerald-500/15', text: 'text-emerald-400', icon: '💪', title: 'Strengths' },
                                { key: 'weaknesses', bg: 'bg-red-500/5', border: 'border-red-500/15', text: 'text-red-400', icon: '⚠️', title: 'Weaknesses' },
                                { key: 'opportunities', bg: 'bg-blue-500/5', border: 'border-blue-500/15', text: 'text-blue-400', icon: '🚀', title: 'Opportunities' },
                                { key: 'threats', bg: 'bg-amber-500/5', border: 'border-amber-500/15', text: 'text-amber-400', icon: '🛡️', title: 'Threats' },
                            ].map(({ key, bg, border, text, icon, title }) => {
                                const items = personalAnalysis.swot[key] || [];
                                return (
                                    <div key={key} className={`${bg} p-4 rounded-xl border ${border}`}>
                                        <h4 className={`${text} font-bold mb-3 text-sm flex items-center gap-2`}><span>{icon}</span> {title}</h4>
                                        <ul className="space-y-2">
                                            {items.map((item, i) => (
                                                <li key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
                                                    <span className={`${text} opacity-50 flex-shrink-0 mt-0.5`}>•</span>
                                                    <span>{typeof item === 'string' ? item : item.point || JSON.stringify(item)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {personalAnalysis.skillGaps && personalAnalysis.skillGaps.length > 0 && (
                        <div className="mt-6">
                            <SkillGapBars gaps={personalAnalysis.skillGaps} />
                        </div>
                    )}
                </div>
            )}

            {/* ── Original Job Post (collapsible) ── */}
            <div className="border-t border-white/5 pt-6">
                <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors w-full"
                >
                    <ChevronDown size={14} className={`transition-transform ${showOriginal ? 'rotate-180' : ''}`} />
                    <span>Original Job Posting</span>
                    {app.job_url && (
                        <a href={app.job_url} target="_blank" className="ml-auto text-blue-400 hover:underline text-xs flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}>
                            View Live <ExternalLink size={10} />
                        </a>
                    )}
                </button>
                {showOriginal && (
                    <div className="mt-3 bg-gray-950/50 rounded-xl border border-gray-700/50 p-6 max-h-[500px] overflow-y-auto animate-in slide-in-from-top-2 fade-in duration-300">
                        {app.formatted_content ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{app.formatted_content}</ReactMarkdown>
                            </div>
                        ) : app.original_content ? (
                            <div className="whitespace-pre-wrap text-gray-300 text-sm leading-7">{app.original_content}</div>
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-8">No content archived.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
