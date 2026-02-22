'use client';

import React, { useState } from 'react';
import { RefreshCw, Sparkles, ChevronDown } from 'lucide-react';

const FRAMEWORKS = {
    star: { label: '⭐ STAR Stories', desc: 'Behavioral interview answers from your CV' },
    whyCompany: { label: '🏢 Why This Company', desc: '60-second compelling answer script' },
    salary: { label: '💰 Salary Negotiation', desc: 'Data-backed negotiation strategy' },
    plan3060: { label: '📅 30-60-90 Day Plan', desc: 'Show you\'ve thought about impact' },
    competency: { label: '🎯 Question Predictor', desc: 'Most likely interview questions' },
};

export default function HiringFrameworks({ appId, existingData, onDataUpdate }) {
    const [loading, setLoading] = useState(null);
    const [expandedFramework, setExpandedFramework] = useState(null);

    const generate = async (framework) => {
        setLoading(framework);
        try {
            const res = await fetch('/api/ai/hiring-frameworks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: appId, framework })
            });
            if (res.ok) {
                const result = await res.json();
                onDataUpdate?.(framework, result.data);
                setExpandedFramework(framework);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to generate');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to generate framework');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-3 mt-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Hiring Frameworks</h4>
            {Object.entries(FRAMEWORKS).map(([key, { label, desc }]) => {
                const data = existingData?.[key]?.data;
                const isExpanded = expandedFramework === key;
                const isLoading = loading === key;

                return (
                    <div key={key} className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
                        <div
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setExpandedFramework(isExpanded ? null : key); }}
                        >
                            <div>
                                <div className="text-sm font-semibold text-white">{label}</div>
                                <div className="text-xs text-gray-500">{desc}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                {data && <span className="text-[10px] text-green-500 font-medium">Generated</span>}
                                {!data ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); generate(key); }}
                                        disabled={isLoading}
                                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        {isLoading ? 'Generating...' : 'Generate'}
                                    </button>
                                ) : (
                                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                )}
                            </div>
                        </div>

                        {isExpanded && data && (
                            <div className="p-4 pt-0 border-t border-gray-700/50 animate-in fade-in slide-in-from-top-2 duration-200" onClick={e => e.stopPropagation()}>
                                <FrameworkRenderer type={key} data={data} />
                                <button
                                    onClick={(e) => { e.stopPropagation(); generate(key); }}
                                    disabled={isLoading}
                                    className="mt-3 text-xs text-purple-400 hover:text-purple-300 underline disabled:opacity-50"
                                >
                                    {isLoading ? 'Regenerating...' : '↻ Regenerate'}
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function FrameworkRenderer({ type, data }) {
    switch (type) {
        case 'star': return <StarRenderer data={data} />;
        case 'whyCompany': return <WhyCompanyRenderer data={data} />;
        case 'salary': return <SalaryRenderer data={data} />;
        case 'plan3060': return <PlanRenderer data={data} />;
        case 'competency': return <CompetencyRenderer data={data} />;
        default: return <pre className="text-xs text-gray-400 overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
    }
}

function StarRenderer({ data }) {
    return (
        <div className="space-y-3 pt-3">
            {(data.stories || []).map((story, i) => (
                <details key={i} className="group bg-gray-900/40 rounded-xl border border-amber-500/10 overflow-hidden">
                    <summary className="flex items-start gap-3 p-3.5 cursor-pointer list-none select-none hover:bg-gray-900/60 transition-colors">
                        <span className="text-amber-400 font-bold text-sm mt-0.5 w-5 text-center shrink-0">
                            <span className="block group-open:hidden">+</span>
                            <span className="hidden group-open:block">−</span>
                        </span>
                        <div className="min-w-0">
                            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">→ {story.targetRequirement}</div>
                            {story.transitionPhrase && <div className="text-xs text-gray-500 italic line-clamp-1">"{story.transitionPhrase}"</div>}
                        </div>
                    </summary>
                    <div className="px-4 pb-4 pl-11 space-y-2 text-sm border-t border-gray-700/30">
                        <div className="pt-3"><span className="text-blue-400 font-bold">S:</span> <span className="text-gray-300">{story.situation}</span></div>
                        <div><span className="text-green-400 font-bold">T:</span> <span className="text-gray-300">{story.task}</span></div>
                        <div><span className="text-purple-400 font-bold">A:</span> <span className="text-gray-300">{story.action}</span></div>
                        <div><span className="text-emerald-400 font-bold">R:</span> <span className="text-gray-300">{story.result}</span></div>
                    </div>
                </details>
            ))}
        </div>
    );
}

function WhyCompanyRenderer({ data }) {
    return (
        <div className="space-y-4 pt-3">
            {data.keyConnections?.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs text-gray-400 font-bold uppercase">Key Connections</div>
                    {data.keyConnections.map((conn, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-gray-900/30 p-2 rounded-lg">
                            <span className="text-blue-400 font-medium">{conn.companyElement}</span>
                            <span className="text-gray-600">→</span>
                            <span className="text-green-400 font-medium">{conn.candidateExperience}</span>
                        </div>
                    ))}
                </div>
            )}
            <details className="group">
                <summary className="text-xs text-purple-400 cursor-pointer hover:text-purple-300 transition-colors font-medium">
                    <span className="group-open:hidden">Show full script →</span>
                    <span className="hidden group-open:inline">Hide script</span>
                </summary>
                <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10 mt-2">
                    <p className="text-gray-200 italic leading-relaxed text-sm">&quot;{data.script}&quot;</p>
                </div>
            </details>
            {data.deliveryTip && (
                <div className="text-xs text-gray-500 italic">💡 {data.deliveryTip}</div>
            )}
        </div>
    );
}

function SalaryRenderer({ data }) {
    return (
        <div className="space-y-4 pt-3">
            {data.marketRange && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-900/40 p-3 rounded-xl text-center border border-gray-700/50">
                        <div className="text-xs text-gray-500 mb-1">Low</div>
                        <div className="text-lg font-bold text-red-400">{data.marketRange.low}</div>
                    </div>
                    <div className="bg-gray-900/40 p-3 rounded-xl text-center border border-emerald-500/20">
                        <div className="text-xs text-gray-500 mb-1">Target</div>
                        <div className="text-lg font-bold text-emerald-400">{data.marketRange.mid}</div>
                    </div>
                    <div className="bg-gray-900/40 p-3 rounded-xl text-center border border-gray-700/50">
                        <div className="text-xs text-gray-500 mb-1">High</div>
                        <div className="text-lg font-bold text-blue-400">{data.marketRange.high}</div>
                    </div>
                </div>
            )}
            {data.leveragePoints?.length > 0 && (
                <div>
                    <div className="text-xs text-gray-400 font-bold uppercase mb-2">Your Leverage</div>
                    <div className="flex flex-wrap gap-2">
                        {data.leveragePoints.map((p, i) => (
                            <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs">{p}</span>
                        ))}
                    </div>
                </div>
            )}
            {data.negotiationScript && (
                <details className="group">
                    <summary className="text-xs text-purple-400 cursor-pointer hover:text-purple-300 transition-colors font-medium">
                        <span className="group-open:hidden">Show negotiation scripts →</span>
                        <span className="hidden group-open:inline">Hide scripts</span>
                    </summary>
                    <div className="space-y-2 mt-2">
                        {Object.entries(data.negotiationScript).map(([key, value]) => (
                            <div key={key} className="bg-gray-900/40 p-3 rounded-lg border border-gray-700/30">
                                <div className="text-xs text-gray-500 font-bold uppercase mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                                <div className="text-sm text-gray-300">{value}</div>
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}

function PlanRenderer({ data }) {
    const phases = [
        { key: 'days30', label: 'First 30 Days', color: 'blue', emoji: '🚀' },
        { key: 'days60', label: 'Days 31-60', color: 'purple', emoji: '📈' },
        { key: 'days90', label: 'Days 61-90', color: 'emerald', emoji: '🎯' },
    ];

    return (
        <div className="space-y-4 pt-3">
            {phases.map(({ key, label, color, emoji }) => {
                const phase = data[key];
                if (!phase) return null;
                return (
                    <div key={key} className={`bg-${color}-500/5 p-4 rounded-xl border border-${color}-500/10`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span>{emoji}</span>
                            <span className={`text-xs text-${color}-400 font-bold uppercase`}>{label}</span>
                        </div>
                        <div className="text-sm text-white font-medium mb-2">{phase.theme}</div>
                        <ul className="space-y-1">
                            {(phase.goals || []).map((g, i) => (
                                <li key={i} className="text-xs text-gray-300 flex gap-2">
                                    <span className={`text-${color}-500 shrink-0`}>•</span> <span>{g}</span>
                                </li>
                            ))}
                        </ul>
                        {phase.quickWins?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {phase.quickWins.map((w, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px] font-medium">⚡ {w}</span>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
            {data.presentationTip && (
                <div className="text-xs text-gray-500 italic">💡 {data.presentationTip}</div>
            )}
        </div>
    );
}

function CompetencyRenderer({ data }) {
    return (
        <div className="space-y-3 pt-3">
            {(data.questions || []).map((q, i) => (
                <details key={i} className="group bg-gray-900/40 rounded-xl border border-gray-700/50 overflow-hidden">
                    <summary className="flex items-start gap-3 p-3.5 cursor-pointer list-none select-none hover:bg-gray-900/60 transition-colors">
                        <span className="text-blue-400 font-bold text-sm mt-0.5 w-5 text-center shrink-0">
                            <span className="block group-open:hidden">+</span>
                            <span className="hidden group-open:block">−</span>
                        </span>
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-white mb-1">&quot;{q.question}&quot;</div>
                            <div className="flex gap-2 flex-wrap">
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px] font-bold">{q.competency}</span>
                                <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-[10px]">from: {q.fromRequirement}</span>
                            </div>
                        </div>
                    </summary>
                    <div className="px-4 pb-4 pl-11 space-y-2 border-t border-gray-700/30 pt-3">
                        <div className="text-xs text-gray-400"><span className="text-green-400 font-bold">✓ Strategy:</span> {q.strategy}</div>
                        <div className="text-xs text-gray-400"><span className="text-red-400 font-bold">✗ Avoid:</span> {q.redFlag}</div>
                    </div>
                </details>
            ))}
        </div>
    );
}
