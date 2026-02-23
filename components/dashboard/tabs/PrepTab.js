import React from 'react';
import { InterviewQuestionsList, QuestionsToAskList, RedFlagsList, QuickReferenceCard } from '../InterviewPrepTools';
import { parseJson } from '../utils';

export function PrepTab({ app }) {
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
                        <p className="text-base text-gray-400">{app.company}</p>
                        {app.role_summary && (
                            <p className="text-base text-gray-300 mt-3 leading-relaxed">
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
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700/30">
                    {app.salary && (
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-base font-medium border border-emerald-500/15">💰 {app.salary}</span>
                    )}
                    {app.location && (
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-base font-medium border border-blue-500/15">📍 {app.location}</span>
                    )}
                    {app.work_mode && (
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-base font-medium border border-purple-500/15">🏢 {app.work_mode}</span>
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
                                        <span className="text-amber-500 font-bold text-base mt-0.5 w-4 text-center flex-shrink-0">
                                            <span className="block group-open:hidden">+</span>
                                            <span className="hidden group-open:block">−</span>
                                        </span>
                                        <span className="text-base font-medium text-amber-100 leading-relaxed">{pointText}</span>
                                    </summary>
                                    {explanation && (
                                        <div className="px-3.5 pb-3.5 pl-10 text-gray-400 text-base leading-relaxed">
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
                        <span className="p-1.5 bg-blue-500/10 rounded-lg">❓</span> Questions They'll Likely Ask You
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
                                        <p className="text-base text-gray-200 font-medium leading-relaxed">{q}</p>
                                        <p className="text-base text-gray-500 mt-1.5">→ Address potential gap between your experience and this role</p>
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

