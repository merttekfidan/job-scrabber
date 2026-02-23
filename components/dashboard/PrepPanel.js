'use client';

import React from 'react';
import {
    RefreshCw, Sparkles, ExternalLink, GraduationCap, Users
} from 'lucide-react';
import { parseJson } from './utils';
import { InterviewProgress } from './VisualFrameworks';
import { InterviewQuestionsList, QuestionsToAskList, RedFlagsList, QuickReferenceCard } from './InterviewPrepTools';
import HiringFrameworks from './HiringFrameworks';

export default function PrepPanel({ app, isAnalyzing, onAnalyzeJob, onUpdateDetails }) {
    const prep = typeof app.interview_prep_notes === 'string'
        ? safeJsonParse(app.interview_prep_notes)
        : app.interview_prep_notes || {};
    const talkingPoints = parseJson(app.interview_prep_key_talking_points);
    const questionsRaw = parseJson(app.interview_prep_questions_to_ask);
    const redFlagsRaw = parseJson(app.interview_prep_potential_red_flags);
    const likelyQuestions = prep.likelyInterviewQuestions || [];
    const personalAnalysis = app.personalized_analysis;
    const hasPersonalized = !!personalAnalysis;
    const stages = parseJson(app.interview_stages) || [];

    function safeJsonParse(str) {
        try { return typeof str === 'string' ? JSON.parse(str) : str || {}; }
        catch { return {}; }
    }

    return (
        <div className="space-y-8">
            {/* ── Generate Button (if no personalized data) ── */}
            {!hasPersonalized && (
                <div className="bg-gray-800/30 p-8 rounded-2xl border border-dashed border-gray-700 text-center">
                    <Sparkles className="mx-auto mb-4 text-purple-400 animate-pulse" size={40} />
                    <h3 className="text-xl font-bold text-white mb-2">Personalized AI Coaching</h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm">
                        Cross-reference this job with your CV — get tailored talking points, SWOT analysis, and interview prep.
                    </p>
                    <button
                        className="btn btn-primary bg-purple-600 hover:bg-purple-700 border-none shadow-lg shadow-purple-900/20"
                        onClick={() => onAnalyzeJob(app.id)}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <><RefreshCw size={18} className="animate-spin mr-2" /> Analyzing...</>
                        ) : (
                            'Generate Personalized Insights'
                        )}
                    </button>
                </div>
            )}

            {/* ── Role Snapshot ── */}
            <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl border border-gray-700/40 p-5">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 font-bold text-lg flex-shrink-0">
                        {app.company?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white">{app.job_title}</h3>
                        <p className="text-sm text-gray-400">{app.company}</p>
                        {app.role_summary && (
                            <p className="text-sm text-gray-300 mt-2 leading-relaxed">
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
            </div>

            {/* ── Quick Reference Card ── */}
            {(talkingPoints.length > 0 || questionsRaw.length > 0) && (
                <QuickReferenceCard app={app} talkingPoints={talkingPoints} questionsToAsk={questionsRaw} />
            )}

            {/* ── Likely Interview Questions ── */}
            {likelyQuestions.length > 0 && (
                <div>
                    <h3 className="text-base font-bold text-orange-400 mb-4 flex items-center gap-2">
                        <span className="p-1.5 bg-orange-500/10 rounded-lg"><GraduationCap size={16} /></span> Anticipated Questions
                    </h3>
                    <InterviewQuestionsList questions={likelyQuestions} />
                </div>
            )}

            {/* ── Questions You Should Ask ── */}
            {questionsRaw.length > 0 && (
                <div className="pt-2">
                    <h3 className="text-base font-bold text-cyan-400 mb-4 flex items-center gap-2">
                        <span className="p-1.5 bg-cyan-500/10 rounded-lg">❓</span> Questions You Should Ask
                    </h3>
                    <QuestionsToAskList questions={questionsRaw} />
                </div>
            )}

            {/* ── Red Flags ── */}
            {redFlagsRaw.length > 0 && (
                <div className="pt-2">
                    <h3 className="text-base font-bold text-red-400 mb-4 flex items-center gap-2">
                        <span className="p-1.5 bg-red-500/10 rounded-lg">🚩</span> Potential Red Flags & Probes
                    </h3>
                    <RedFlagsList redFlags={redFlagsRaw} />
                </div>
            )}

            {/* ── AI Hiring Frameworks ── */}
            {hasPersonalized && (
                <div className="border-t border-white/5 pt-8">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-purple-400" /> Advanced Hiring Frameworks
                    </h3>
                    <HiringFrameworks
                        appId={app.id}
                        existingData={personalAnalysis?.hiringFrameworks}
                        onDataUpdate={(framework, data) => {
                            const currentAnalysis = app.personalized_analysis || {};
                            const updatedAnalysis = {
                                ...currentAnalysis,
                                hiringFrameworks: {
                                    ...(currentAnalysis.hiringFrameworks || {}),
                                    [framework]: { data }
                                }
                            };
                            onUpdateDetails(app.id, { personalized_analysis: updatedAnalysis });
                        }}
                    />
                </div>
            )}

            {/* ── Tech Stack to Study ── */}
            {prep.techStackToStudy && prep.techStackToStudy.length > 0 && (
                <div>
                    <h3 className="text-base font-bold text-violet-400 mb-4 flex items-center gap-2">
                        <span className="p-1.5 bg-violet-500/10 rounded-lg">📚</span> Tech to Study
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {prep.techStackToStudy.map((tech, i) => (
                            <span key={i} className="px-3 py-1.5 bg-violet-500/10 text-violet-300 rounded-lg text-xs border border-violet-500/15 font-medium">{tech}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Interview Schedule ── */}
            <div className="border-t border-white/5 pt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users size={18} className="text-blue-400" /> Interview Rounds
                    </h3>
                    <button
                        className="btn btn-secondary btn-sm flex items-center gap-2 text-xs"
                        onClick={() => {
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
                        <div className="w-4 h-4 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-xs">+</div>
                        Add Round
                    </button>
                </div>

                {stages.length > 0 && (
                    <div className="mb-4">
                        <InterviewProgress stages={stages} currentStatus={app.status} />
                    </div>
                )}

                {stages.length === 0 ? (
                    <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                        <p className="text-gray-500 text-sm">No interviews tracked yet. Click "Add Round" when you schedule one.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stages.map((stage, idx) => (
                            <div key={stage.id || idx} className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                                <div className="p-3 bg-gray-800/80 border-b border-gray-700/50 flex flex-wrap gap-3 items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-blue-400 text-sm">{stage.round}</span>
                                        <select
                                            className="bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg p-1.5 outline-none"
                                            value={stage.type}
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
                                            onChange={(e) => {
                                                const newStages = [...stages];
                                                newStages[idx].date = e.target.value;
                                                onUpdateDetails(app.id, { interview_stages: newStages });
                                            }}
                                        />
                                        <button
                                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                            onClick={() => {
                                                if (confirm('Delete round?')) {
                                                    const newStages = stages.filter((_, i) => i !== idx);
                                                    onUpdateDetails(app.id, { interview_stages: newStages });
                                                }
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <textarea
                                        className="w-full bg-transparent text-sm text-gray-300 outline-none resize-none placeholder:text-gray-700"
                                        placeholder="Round notes..."
                                        rows={2}
                                        value={stage.notes || ''}
                                        onChange={(e) => {
                                            const newStages = [...stages];
                                            newStages[idx].notes = e.target.value;
                                            onUpdateDetails(app.id, { interview_stages: newStages });
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
