'use client';

import React, { useState, useCallback } from 'react';
import {
    RefreshCw, Sparkles, ExternalLink, GraduationCap, Users, BookOpen, ChevronDown, ChevronUp, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseJson } from './utils';
import { InterviewProgress } from './VisualFrameworks';
import { InterviewQuestionsList, QuestionsToAskList, RedFlagsList } from './InterviewPrepTools';
import HiringFrameworks from './HiringFrameworks';
import { StudyPackageView } from '@/components/study/StudyPackageView';
import { DebriefPanel } from '@/components/debrief/DebriefPanel';
import { BriefingCard } from '@/components/briefing/BriefingCard';
import { MockPanel } from '@/components/mock/MockPanel';

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

    const [notesDraft, setNotesDraft] = useState({});
    const [dirtyRounds, setDirtyRounds] = useState({});
    const [studyOpenRounds, setStudyOpenRounds] = useState({});
    const [debriefOpenRounds, setDebriefOpenRounds] = useState({});
    const [briefingOpenRounds, setBriefingOpenRounds] = useState({});
    const [mockOpenRounds, setMockOpenRounds] = useState({});

    const handleToggleStudy = useCallback((idx) => {
        setStudyOpenRounds((prev) => ({ ...prev, [idx]: !prev[idx] }));
    }, []);

    const handleToggleDebrief = useCallback((idx) => {
        setDebriefOpenRounds((prev) => ({ ...prev, [idx]: !prev[idx] }));
    }, []);

    const handleToggleBriefing = useCallback((idx) => {
        setBriefingOpenRounds((prev) => ({ ...prev, [idx]: !prev[idx] }));
    }, []);

    const handleToggleMock = useCallback((idx) => {
        setMockOpenRounds((prev) => ({ ...prev, [idx]: !prev[idx] }));
    }, []);

    const handleRoundNotesChange = useCallback((idx, value) => {
        setNotesDraft((prev) => ({ ...prev, [idx]: value }));
        setDirtyRounds((prev) => ({ ...prev, [idx]: true }));
    }, []);

    const handleRoundNotesSave = useCallback((idx) => {
        const currentStages = [...stages];
        if (idx < 0 || idx >= currentStages.length) return;
        const value = notesDraft[idx] !== undefined ? notesDraft[idx] : (currentStages[idx]?.notes ?? '');
        currentStages[idx] = { ...currentStages[idx], notes: value };
        onUpdateDetails(app.id, { interview_stages: currentStages });
        setDirtyRounds((prev) => {
            const next = { ...prev };
            delete next[idx];
            return next;
        });
    }, [app.id, onUpdateDetails, notesDraft, stages]);

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
                    <p className="text-gray-400 mb-6 max-w-md mx-auto text-base">
                        Cross-reference this job with your CV — get tailored talking points, SWOT analysis, and interview prep.
                    </p>
                    <Button
                        className="bg-purple-600 hover:bg-purple-700 border-none shadow-lg shadow-purple-900/20"
                        onClick={() => onAnalyzeJob(app.id)}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <><RefreshCw size={18} className="animate-spin mr-2" /> Analyzing...</>
                        ) : (
                            'Generate Personalized Insights'
                        )}
                    </Button>
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
                        <p className="text-base text-gray-400">{app.company}</p>
                        {app.role_summary && (
                            <p className="text-base text-gray-300 mt-2 leading-relaxed">
                                <span className="text-blue-400 font-semibold">The Problem:</span> {app.role_summary}
                            </p>
                        )}
                        {hasPersonalized && personalAnalysis.prep?.tailoredAdvice && (
                            <p className="text-base text-emerald-300/80 mt-2 leading-relaxed italic">
                                <span className="text-emerald-400 font-semibold not-italic">Your Positioning:</span> {personalAnalysis.prep.tailoredAdvice}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Briefing Card (replaces QuickReferenceCard) ── */}
            <div className="border border-white/5 rounded-xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => setBriefingOpenRounds((prev) => ({ ...prev, top: !prev.top }))}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors"
                    aria-expanded={!!briefingOpenRounds.top}
                    aria-label="Toggle briefing card"
                    tabIndex={0}
                >
                    <span className="flex items-center gap-2">
                        <Target size={14} />
                        Interview Briefing Card
                    </span>
                    {briefingOpenRounds.top ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {briefingOpenRounds.top && (
                    <div className="p-4">
                        <BriefingCard
                            applicationId={app.id}
                            roundType={stages.length > 0 ? (stages[stages.length - 1].type || 'Screening') : 'Screening'}
                            roundLabel={stages.length > 0 ? stages[stages.length - 1].round : undefined}
                        />
                    </div>
                )}
            </div>

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
                            <span key={i} className="px-3 py-1.5 bg-violet-500/10 text-violet-300 rounded-lg text-base border border-violet-500/15 font-medium">{tech}</span>
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
                    <Button
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-2 text-base"
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
                        <div className="w-4 h-4 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-base">+</div>
                        Add Round
                    </Button>
                </div>

                {stages.length > 0 && (
                    <div className="mb-4">
                        <InterviewProgress stages={stages} currentStatus={app.status} />
                    </div>
                )}

                {stages.length === 0 ? (
                    <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                        <p className="text-gray-500 text-base">No interviews tracked yet. Click "Add Round" when you schedule one.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stages.map((stage, idx) => (
                            <div key={stage.id || idx} className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                                <div className="p-3 bg-gray-800/80 border-b border-gray-700/50 flex flex-wrap gap-3 items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-blue-400 text-base">{stage.round}</span>
                                        <select
                                            className="bg-gray-900 border border-gray-700 text-gray-300 text-base rounded-lg p-1.5 outline-none"
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
                                            className="bg-gray-900 border border-gray-700 text-gray-300 text-base rounded-lg p-1.5 outline-none"
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
                                <div className="p-3 space-y-2">
                                    <textarea
                                        className="w-full bg-transparent text-base text-gray-300 outline-none resize-none placeholder:text-gray-700 min-h-[200px]"
                                        placeholder="Round notes..."
                                        rows={10}
                                        value={notesDraft[idx] !== undefined ? notesDraft[idx] : (stage.notes || '')}
                                        onChange={(e) => handleRoundNotesChange(idx, e.target.value)}
                                        aria-label={`Notes for ${stage.round}`}
                                    />
                                    {dirtyRounds[idx] && (
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="text-base px-3 py-1.5"
                                                onClick={() => handleRoundNotesSave(idx)}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* ── Study Package ── */}
                                <div className="border-t border-gray-700/50">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleStudy(idx)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-blue-400 hover:bg-gray-700/30 transition-colors"
                                        aria-expanded={!!studyOpenRounds[idx]}
                                        aria-label="Toggle study package"
                                        tabIndex={0}
                                    >
                                        <span className="flex items-center gap-2">
                                            <BookOpen size={14} />
                                            Study Package
                                        </span>
                                        {studyOpenRounds[idx]
                                            ? <ChevronUp size={14} />
                                            : <ChevronDown size={14} />
                                        }
                                    </button>
                                    {studyOpenRounds[idx] && (
                                        <div className="px-3 pb-4 pt-1">
                                            <StudyPackageView
                                                applicationId={app.id}
                                                roundIndex={idx}
                                                roundType={stage.type || 'Screening'}
                                                roundLabel={stage.round}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* ── Briefing Card (per round) ── */}
                                <div className="border-t border-gray-700/50">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleBriefing(idx)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-yellow-400 hover:bg-gray-700/30 transition-colors"
                                        aria-expanded={!!briefingOpenRounds[idx]}
                                        aria-label="Toggle briefing card"
                                        tabIndex={0}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Target size={14} />
                                            Briefing Card
                                        </span>
                                        {briefingOpenRounds[idx]
                                            ? <ChevronUp size={14} />
                                            : <ChevronDown size={14} />
                                        }
                                    </button>
                                    {briefingOpenRounds[idx] && (
                                        <div className="px-3 pb-4 pt-1">
                                            <BriefingCard
                                                applicationId={app.id}
                                                roundType={stage.type || 'Screening'}
                                                roundIndex={idx}
                                                roundLabel={stage.round}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* ── Interview Debrief ── */}
                                <div className="border-t border-gray-700/50">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleDebrief(idx)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-purple-400 hover:bg-gray-700/30 transition-colors"
                                        aria-expanded={!!debriefOpenRounds[idx]}
                                        aria-label="Toggle debrief"
                                        tabIndex={0}
                                    >
                                        <span className="flex items-center gap-2">
                                            <ChevronDown size={14} className="rotate-0" />
                                            Interview Debrief
                                        </span>
                                        {debriefOpenRounds[idx]
                                            ? <ChevronUp size={14} />
                                            : <ChevronDown size={14} />
                                        }
                                    </button>
                                    {debriefOpenRounds[idx] && (
                                        <div className="px-3 pb-4 pt-1">
                                            <DebriefPanel
                                                applicationId={app.id}
                                                roundIndex={idx}
                                                roundType={stage.type || 'Screening'}
                                                roundLabel={stage.round}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* ── Mock Interview ── */}
                                <div className="border-t border-gray-700/50">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleMock(idx)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-violet-400 hover:bg-gray-700/30 transition-colors"
                                        aria-expanded={!!mockOpenRounds[idx]}
                                        aria-label="Toggle mock interview"
                                        tabIndex={0}
                                    >
                                        <span className="flex items-center gap-2">🎙 Mock Interview</span>
                                        {mockOpenRounds[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    {mockOpenRounds[idx] && (
                                        <div className="px-3 pb-4 pt-1">
                                            <MockPanel
                                                applicationId={app.id}
                                                defaultRoundType={stage.type || 'Screening'}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
