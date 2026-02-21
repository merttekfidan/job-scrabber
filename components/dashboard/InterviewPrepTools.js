'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Copy, CheckCircle } from 'lucide-react';

/**
 * Flashcard mode — cycles through talking points, questions, and skills as flip cards.
 */
export function FlashcardMode({ talkingPoints = [], questions = [], skills = [] }) {
    const cards = useMemo(() => {
        const all = [];
        talkingPoints.forEach(tp => {
            const isObj = typeof tp === 'object' && tp !== null;
            all.push({ front: isObj ? tp.point || tp.topic : tp, back: isObj ? (tp.explanation || tp.narrative || '') : '', type: 'Talking Point' });
        });
        questions.forEach(q => all.push({ front: q, back: 'Prepare your STAR answer for this question', type: 'Question' }));
        skills.forEach(s => all.push({ front: s, back: 'Review this skill before the interview', type: 'Skill' }));
        return all;
    }, [talkingPoints, questions, skills]);

    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);

    if (cards.length === 0) return null;

    const card = cards[index];
    const typeColor = card.type === 'Talking Point' ? 'amber' : card.type === 'Question' ? 'blue' : 'green';

    return (
        <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Flashcard Mode</h4>
                <span className="text-xs text-gray-500">{index + 1} / {cards.length}</span>
            </div>

            <div
                className="min-h-[180px] bg-gray-900/50 rounded-xl border border-gray-700/30 p-6 cursor-pointer transition-all hover:border-gray-600/50 flex flex-col justify-center"
                onClick={() => setFlipped(!flipped)}
            >
                <span className={`text-[10px] font-bold uppercase tracking-widest text-${typeColor}-400 mb-2`}>
                    {card.type} {flipped ? '— Answer' : '— Click to reveal'}
                </span>
                <p className={`text-lg ${flipped ? 'text-gray-300' : 'text-white font-semibold'} leading-relaxed`}>
                    {flipped ? (card.back || 'No additional detail available') : card.front}
                </p>
            </div>

            <div className="flex items-center justify-between mt-4">
                <button
                    onClick={() => { setIndex(Math.max(0, index - 1)); setFlipped(false); }}
                    disabled={index === 0}
                    className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 disabled:opacity-30 transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>

                <button
                    onClick={() => { setIndex(0); setFlipped(false); }}
                    className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                >
                    <RotateCcw size={12} /> Reset
                </button>

                <button
                    onClick={() => { setIndex(Math.min(cards.length - 1, index + 1)); setFlipped(false); }}
                    disabled={index === cards.length - 1}
                    className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 disabled:opacity-30 transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}

/**
 * Cheat Sheet — a compact, copy-able one-pager summary.
 */
export function CheatSheet({ app }) {
    const [copied, setCopied] = useState(false);

    const talkingPoints = useMemo(() => {
        try {
            const raw = app.interview_prep_key_talking_points;
            return typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
        } catch { return []; }
    }, [app]);

    const questions = useMemo(() => {
        try {
            const raw = app.interview_prep_questions_to_ask;
            return typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
        } catch { return []; }
    }, [app]);

    const skills = useMemo(() => {
        try {
            const raw = app.required_skills;
            return typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
        } catch { return []; }
    }, [app]);

    const cheatText = useMemo(() => {
        let text = `📋 CHEAT SHEET — ${app.job_title} at ${app.company}\n`;
        text += `${'─'.repeat(50)}\n\n`;

        if (app.role_summary) text += `📌 ROLE: ${app.role_summary}\n\n`;

        if (skills.length > 0) {
            text += `🛠 KEY SKILLS: ${skills.join(', ')}\n\n`;
        }

        if (talkingPoints.length > 0) {
            text += `💡 TALKING POINTS:\n`;
            talkingPoints.forEach((tp, i) => {
                const point = typeof tp === 'object' ? tp.point || tp.topic : tp;
                text += `  ${i + 1}. ${point}\n`;
            });
            text += '\n';
        }

        if (questions.length > 0) {
            text += `❓ QUESTIONS TO ASK:\n`;
            questions.forEach((q, i) => { text += `  ${i + 1}. ${q}\n`; });
            text += '\n';
        }

        text += `💰 SALARY: ${app.salary || 'Not listed'}\n`;
        text += `📍 LOCATION: ${app.location || 'Remote'}\n`;
        text += `🏢 MODE: ${app.work_mode || 'N/A'}\n`;

        return text;
    }, [app, talkingPoints, questions, skills]);

    const handleCopy = () => {
        navigator.clipboard.writeText(cheatText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">📋 Interview Cheat Sheet</h4>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                    {copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
            </div>
            <pre className="text-xs text-gray-300 bg-gray-900/50 rounded-xl p-4 border border-gray-700/30 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[400px] overflow-y-auto">
                {cheatText}
            </pre>
        </div>
    );
}

/**
 * Mock Interview Questions — interactive question drill with reveal answers.
 */
export function MockInterviewDrill({ questions = [], talkingPoints = [] }) {
    const allQuestions = useMemo(() => {
        const qs = [];
        questions.forEach(q => qs.push({ question: q, hint: 'Use the STAR method to structure your answer' }));
        talkingPoints.forEach(tp => {
            const isObj = typeof tp === 'object' && tp !== null;
            if (isObj) {
                qs.push({
                    question: `Tell me about your experience with ${tp.point || tp.topic}`,
                    hint: tp.explanation || tp.narrative || ''
                });
            }
        });
        return qs;
    }, [questions, talkingPoints]);

    const [revealed, setRevealed] = useState({});

    if (allQuestions.length === 0) return null;

    return (
        <div className="bg-gray-800/30 rounded-2xl border border-gray-700/50 p-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">🎤 Mock Interview Drill</h4>
            <div className="space-y-3">
                {allQuestions.slice(0, 8).map((item, i) => (
                    <div key={i} className="bg-gray-900/40 rounded-xl border border-gray-700/30 overflow-hidden">
                        <div
                            className="p-3 cursor-pointer hover:bg-gray-800/50 transition-colors flex items-start gap-3"
                            onClick={() => setRevealed(prev => ({ ...prev, [i]: !prev[i] }))}
                        >
                            <span className="text-blue-400 font-bold text-sm mt-0.5">Q{i + 1}</span>
                            <div className="flex-1">
                                <p className="text-sm text-white font-medium">{item.question}</p>
                                {!revealed[i] && (
                                    <span className="text-[10px] text-gray-500 mt-1 block">Click to see coaching hint</span>
                                )}
                            </div>
                        </div>
                        {revealed[i] && item.hint && (
                            <div className="px-3 pb-3 pl-10 text-xs text-gray-400 leading-relaxed animate-in fade-in duration-200">
                                💡 {item.hint}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
