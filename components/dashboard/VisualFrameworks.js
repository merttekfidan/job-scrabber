'use client';

import React from 'react';

/**
 * Radial match score gauge — shows 0-100% match with animated SVG ring.
 */
export function MatchScoreGauge({ score = 0 }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle
                        cx="60" cy="60" r={radius} fill="none"
                        stroke={color} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{score}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Match</span>
                </div>
            </div>
            <span className="text-xs text-gray-500 font-medium">
                {score >= 75 ? 'Strong Match' : score >= 50 ? 'Moderate Match' : score >= 25 ? 'Partial Match' : 'Low Match'}
            </span>
        </div>
    );
}

/**
 * Skill gap radar — shows skills as horizontal bars with match indicators.
 * Each skill has a level (0-100) and an optional "required" flag.
 */
export function SkillGapBars({ strengths = [], weaknesses = [] }) {
    return (
        <div className="space-y-4">
            {strengths.length > 0 && (
                <div>
                    <h5 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">✓ Matched Skills</h5>
                    <div className="space-y-1.5">
                        {strengths.slice(0, 6).map((skill, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-gray-300 w-32 truncate">{typeof skill === 'string' ? skill.split('→')[0].replace('CV:', '').trim() : skill}</span>
                                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500/60 rounded-full" style={{ width: `${85 + Math.random() * 15}%`, transition: 'width 0.8s ease' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {weaknesses.length > 0 && (
                <div>
                    <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">✗ Gaps to Address</h5>
                    <div className="space-y-1.5">
                        {weaknesses.slice(0, 6).map((gap, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 w-32 truncate">{typeof gap === 'string' ? gap.split('→')[0].replace('JOB requires:', '').trim() : gap}</span>
                                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500/40 rounded-full" style={{ width: `${15 + Math.random() * 25}%`, transition: 'width 0.8s ease' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Culture fit meter — shows culture keywords with strength bars.
 */
export function CultureFitMeter({ cultureFit }) {
    if (!cultureFit) return null;

    // Extract keywords from culture fit string
    const keywords = cultureFit
        .split(/[,;.]/)
        .map(k => k.trim())
        .filter(k => k.length > 2 && k.length < 30)
        .slice(0, 5);

    if (keywords.length === 0) return null;

    const intensityColors = ['bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500'];

    return (
        <div className="bg-gray-800/30 p-5 rounded-2xl border border-gray-700/50">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Culture Signals</h4>
            <div className="space-y-3">
                {keywords.map((kw, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-300 w-28 truncate font-medium">{kw}</span>
                        <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${intensityColors[i % intensityColors.length]} rounded-full opacity-60`}
                                style={{ width: `${65 + (i * 7)}%`, transition: 'width 1s ease' }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Interview stage progress — shows stages as a horizontal stepped progress bar.
 */
export function InterviewProgress({ stages = [], currentStatus }) {
    if (!stages || stages.length === 0) return null;

    const stageOrder = ['Screening', 'Technical', 'Behavioral', 'Final'];
    const sortedStages = [...stages].sort((a, b) => {
        const ai = stageOrder.indexOf(a.type);
        const bi = stageOrder.indexOf(b.type);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const isPastDate = (dateStr) => new Date(dateStr) < new Date();

    return (
        <div className="bg-gray-800/30 p-5 rounded-2xl border border-gray-700/50">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Interview Progress</h4>
            <div className="flex items-center gap-1">
                {sortedStages.map((stage, i) => {
                    const completed = isPastDate(stage.date);
                    const isCurrent = !completed && (i === 0 || isPastDate(sortedStages[i - 1]?.date));

                    return (
                        <React.Fragment key={stage.id || i}>
                            <div className="flex-1 flex flex-col items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${completed
                                        ? 'bg-green-500/20 border-green-500 text-green-400'
                                        : isCurrent
                                            ? 'bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse'
                                            : 'bg-gray-800 border-gray-700 text-gray-500'
                                    }`}>
                                    {completed ? '✓' : i + 1}
                                </div>
                                <div className="text-center">
                                    <div className={`text-[10px] font-bold ${completed ? 'text-green-400' : isCurrent ? 'text-blue-400' : 'text-gray-500'}`}>
                                        {stage.type}
                                    </div>
                                    <div className="text-[9px] text-gray-600">{stage.round}</div>
                                </div>
                            </div>
                            {i < sortedStages.length - 1 && (
                                <div className={`h-0.5 flex-1 rounded-full mt-[-20px] ${completed ? 'bg-green-500/40' : 'bg-gray-700'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
