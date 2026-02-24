import React from 'react';
import { Briefcase, User, ExternalLink, Share2, Sparkles, RefreshCw } from 'lucide-react';

export function CompanyTab({ app, isAnalyzing, onGenerateInsights, onShare }) {
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
                            <a href={app.company_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-base flex items-center gap-1">
                                Visit Website <ExternalLink size={12} />
                            </a>
                        )}
                    </div>
                </div>

                {app.company_description ? (
                    <div>
                        <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider mb-3">About the Company</h4>
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
                            <p className="text-gray-300 text-base leading-relaxed">{insights.strategicFocus}</p>
                        </div>
                        <div className="bg-pink-500/10 p-5 rounded-2xl border border-pink-500/20">
                            <h4 className="text-pink-400 font-bold mb-2 flex items-center gap-2">
                                <User size={18} /> Culture & Values
                            </h4>
                            <p className="text-gray-300 text-base leading-relaxed">{insights.cultureFit}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {insights.salaryContext && (
                            <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20">
                                <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                                    💰 Salary Intelligence
                                </h4>
                                {typeof insights.salaryContext === 'object' ? (
                                    <div className="flex flex-col gap-2">
                                        {insights.salaryContext.range && (
                                            <div className="flex items-center justify-between bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                                                <span className="text-gray-400 text-base font-medium uppercase tracking-wider">Est. Range</span>
                                                <span className="text-emerald-300 font-bold text-base">{insights.salaryContext.range}</span>
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
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-300 text-base leading-relaxed">{insights.salaryContext}</p>
                                )}
                            </div>
                        )}

                        {/* Hiring Urgency — compact with signals as tags */}
                        {insights.hiringUrgency && (
                            <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${insights.hiringUrgency.level === 'High' ? 'bg-red-500/10 border-red-500/20' :
                                insights.hiringUrgency.level === 'Medium' ? 'bg-amber-500/10 border-amber-500/20' :
                                    'bg-gray-800/50 border-gray-700/50'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <h4 className={`font-bold text-base ${insights.hiringUrgency.level === 'High' ? 'text-red-400' :
                                        insights.hiringUrgency.level === 'Medium' ? 'text-amber-400' : 'text-gray-400'
                                        }`}>⏰ Hiring Urgency</h4>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${insights.hiringUrgency.level === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        insights.hiringUrgency.level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-gray-800 text-gray-400 border-gray-700'
                                        }`}>{insights.hiringUrgency.level}</span>
                                </div>
                                {insights.hiringUrgency.signals?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {insights.hiringUrgency.signals.map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-gray-900/40 text-gray-400 border border-gray-700/50 text-[10px] rounded-md">{s}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Remote Policy — one-liner */}
                        {insights.remotePolicy && (
                            <div className="bg-cyan-500/10 p-4 rounded-2xl border border-cyan-500/20 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-cyan-400 font-bold text-base">🏠 Remote Policy</h4>
                                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md text-[10px] font-bold uppercase">{insights.remotePolicy.type}</span>
                                </div>
                                <span className="text-gray-400 text-base italic line-clamp-2" title={insights.remotePolicy.details}>{insights.remotePolicy.details}</span>
                            </div>
                        )}

                        {/* Competitor Context */}
                        {insights.competitorContext && (
                            <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700/50">
                                <h4 className="text-violet-400 font-bold mb-3">🏁 Competitive Landscape</h4>
                                {insights.competitorContext.likelyCompetitors?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {insights.competitorContext.likelyCompetitors.map((c, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-violet-500/10 text-violet-400 text-base rounded-lg border border-violet-500/20">{c}</span>
                                        ))}
                                    </div>
                                )}
                                {insights.competitorContext.differentiator && (
                                    <p className="text-gray-400 text-base italic">✦ {insights.competitorContext.differentiator}</p>
                                )}
                            </div>
                        )}

                        {/* Culture Signals — enriched with evidence */}
                        {insights.cultureSignals?.length > 0 && (
                            <div className="bg-gray-800/30 p-5 rounded-2xl border border-gray-700/50">
                                <h4 className="text-base font-bold text-gray-400 uppercase tracking-wider mb-4">Culture Signals</h4>
                                <div className="space-y-4">
                                    {insights.cultureSignals.map((cs, i) => (
                                        <div key={i} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                <span className="text-base font-bold text-gray-200">{cs.signal}</span>
                                                <div className="flex items-center gap-3 w-full sm:w-1/2">
                                                    <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                                            style={{ width: `${(cs.rating / 5) * 100}%`, transition: 'width 0.8s ease' }}
                                                        />
                                                    </div>
                                                    <span className="text-base font-bold text-gray-400 w-8">{cs.rating}/5</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {cs.evidence && (
                                                    <p className="text-base text-gray-400 leading-relaxed">
                                                        <span className="text-gray-500 font-medium mr-1.5">Evidence:</span>
                                                        "{cs.evidence}"
                                                    </p>
                                                )}
                                                {cs.implication && (
                                                    <p className="text-base text-indigo-300 leading-relaxed">
                                                        <span className="text-indigo-400/70 font-medium mr-1.5">Implication:</span>
                                                        {cs.implication}
                                                    </p>
                                                )}
                                            </div>
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

