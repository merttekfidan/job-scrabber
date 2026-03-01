import React from 'react';
import { Sparkles, RefreshCw, CheckCircle, AlertCircle, XCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchScoreGauge, SkillGapBars } from '../VisualFrameworks';
import HiringFrameworks from '../HiringFrameworks';
import { SwotQuadrant } from '../shared/SwotQuadrant';
import { parseJson } from '../utils';

export function CoachTab({ app, isAnalyzing, onAnalyzeJob, onUpdateDetails }) {
    if (!app.personalized_analysis) {
        return (
            <div className="bg-gray-800/30 p-8 rounded-2xl border border-dashed border-gray-700 text-center">
                <Sparkles className="mx-auto mb-4 text-purple-400 animate-pulse" size={40} />
                <h3 className="text-xl font-bold text-white mb-2">Personalized AI Advice</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Cross-reference this job with your active CV to get a SWOT analysis and tailored interview talking points.
                </p>
                <Button
                    className="bg-purple-600 hover:bg-purple-700 border-none shadow-lg shadow-purple-900/20"
                    onClick={(e) => { e.stopPropagation(); onAnalyzeJob(app.id); }}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? (
                        <><RefreshCw size={18} className="animate-spin mr-2" /> Analyzing CV & Job...</>
                    ) : (
                        'Generate Personalized Insights'
                    )}
                </Button>
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
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-white font-bold text-lg flex items-center gap-2">
                        <Sparkles size={20} className="text-blue-400" /> Executive SWOT Analysis
                    </h4>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={(e) => { e.stopPropagation(); onAnalyzeJob(app.id); }}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        {isAnalyzing ? 'Analyzing...' : 'Re-Generate SWOT'}
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SwotQuadrant color="green" icon={<CheckCircle size={18} />} title="Strengths" items={parseJson(app.personalized_analysis.swot?.strengths)} />
                    <SwotQuadrant color="red" icon={<AlertCircle size={18} />} title="Gaps / Weaknesses" items={parseJson(app.personalized_analysis.swot?.weaknesses)} />
                    <SwotQuadrant color="blue" icon={<Sparkles size={18} />} title="Opportunities" items={parseJson(app.personalized_analysis.swot?.opportunities)} />
                    <SwotQuadrant color="amber" icon={<XCircle size={18} />} title="Risks / Threats" items={parseJson(app.personalized_analysis.swot?.threats)} />
                </div>
            </div>

            {/* Coaching Strategy */}
            <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl">
                <h4 className="text-purple-400 font-bold mb-4 flex items-center gap-2 text-lg">
                    <User size={20} /> Career Coach's Strategy
                </h4>
                {app.personalized_analysis.prep?.tailoredAdvice && (
                    <p className="text-gray-300 text-base leading-relaxed mb-6">
                        {app.personalized_analysis.prep.tailoredAdvice}
                    </p>
                )}

                {app.personalized_analysis.prep?.infographic && (
                    <div className="mb-8">
                        <h5 className="text-white font-semibold text-base uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                            {app.personalized_analysis.prep.infographic.title || 'Action Plan'}
                        </h5>
                        <div className="flex flex-col md:flex-row gap-4 justify-between relative">
                            <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-gradient-to-r from-purple-500/20 via-purple-500/50 to-purple-500/20 z-0"></div>
                            {app.personalized_analysis.prep.infographic.steps?.map((step, idx) => (
                                <div key={idx} className="relative z-10 flex flex-col items-center flex-1 bg-gray-900/50 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none border border-gray-700/50 md:border-none">
                                    <div className="w-12 h-12 rounded-full bg-gray-800 border-2 border-purple-500/30 flex items-center justify-center text-xl shadow-lg shadow-purple-900/20 mb-3">
                                        {step.icon || '🎯'}
                                    </div>
                                    <h6 className="text-purple-300 font-bold text-base text-center mb-1">{step.label}</h6>
                                    <p className="text-gray-400 text-base text-center leading-relaxed px-2">{step.detail}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <h5 className="text-white font-semibold text-base uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span> Talk Track Details
                    </h5>
                    <div className="grid grid-cols-1 gap-2">
                        {parseJson(app.personalized_analysis.prep?.keyTalkingPoints).map((tp, i) => (
                            <details key={i} className="group bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                                <summary className="flex items-start gap-3 p-3 cursor-pointer list-none select-none hover:bg-gray-800/60 transition-colors">
                                    <span className="text-purple-400 font-bold text-base mt-0.5 w-5 text-center shrink-0">
                                        <span className="block group-open:hidden">+</span>
                                        <span className="hidden group-open:block">−</span>
                                    </span>
                                    <span className="text-base font-medium text-white leading-relaxed">{tp.point}</span>
                                </summary>
                                {tp.explanation && (
                                    <div className="px-3 pb-3 pl-11 text-gray-400 text-base leading-relaxed">
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
                    <span className="text-amber-400 text-base font-bold tracking-wider uppercase" style={{ fontFamily: 'inherit' }}>📋 Quick Cheat Sheet</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <h5 className="text-amber-400 font-bold text-base mb-2" style={{ fontFamily: 'system-ui' }}>🎯 Lead With</h5>
                        <ul className="space-y-1">
                            {parseJson(app.personalized_analysis.swot?.strengths).slice(0, 3).map((s, i) => (
                                <li key={i} className="text-base text-gray-300 flex gap-2">
                                    <span className="text-green-400 shrink-0">✓</span>
                                    <span className="line-clamp-1" style={{ fontFamily: 'system-ui' }}>{typeof s === 'string' ? s.split('→')[0].replace('CV:', '').trim() : s}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-amber-400 font-bold text-base mb-2" style={{ fontFamily: 'system-ui' }}>💬 Key Points</h5>
                        <ul className="space-y-1">
                            {parseJson(app.personalized_analysis.prep?.keyTalkingPoints).slice(0, 3).map((tp, i) => (
                                <li key={i} className="text-base text-gray-300 flex gap-2">
                                    <span className="text-purple-400 shrink-0">→</span>
                                    <span className="line-clamp-1" style={{ fontFamily: 'system-ui' }}>{tp.point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {app.personalized_analysis.swot?.matchScore != null && (
                    <div className="mt-3 flex items-center gap-2 pt-3 border-t border-amber-500/20">
                        <span className="text-base text-gray-500" style={{ fontFamily: 'system-ui' }}>Match Score:</span>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full" style={{ width: `${app.personalized_analysis.swot.matchScore}%`, transition: 'width 0.8s ease' }} />
                        </div>
                        <span className="text-base font-bold text-amber-400" style={{ fontFamily: 'system-ui' }}>{app.personalized_analysis.swot.matchScore}%</span>
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

