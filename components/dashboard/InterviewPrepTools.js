'use client';

import React, { useState, useMemo } from 'react';
import { Copy, CheckCircle, ChevronDown, MessageCircleQuestion, Shield, Lightbulb } from 'lucide-react';

// ─── Helper: normalize old string arrays to new object format ──────────
function normalizeQuestions(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(q => {
        if (typeof q === 'string') return { question: q, reason: '', type: 'Clarify Role' };
        return q;
    });
}

function normalizeRedFlags(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(f => {
        if (typeof f === 'string') return { flag: f, evidence: '', whatToAsk: '' };
        return f;
    });
}

function normalizeInterviewQuestions(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(q => {
        if (typeof q === 'string') return { question: q, hint: '', category: 'Role-Specific' };
        return q;
    });
}

// ─── Category badge colors ──────────────────────────────────────
const CATEGORY_STYLES = {
    'Role-Specific': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    'Technical': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    'Behavioral': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

const TYPE_STYLES = {
    'Clarify Role': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', icon: '🔍' },
    'Probe Concern': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: '⚠️' },
    'Understand Culture': { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', icon: '🏛️' },
};

// ─── Likely Interview Questions ─────────────────────────────────
export function InterviewQuestionsList({ questions = [] }) {
    const normalized = useMemo(() => normalizeInterviewQuestions(questions), [questions]);
    const [expandedIndex, setExpandedIndex] = useState(null);

    if (normalized.length === 0) return null;

    // Group by category
    const grouped = useMemo(() => {
        const groups = {};
        normalized.forEach((q, originalIndex) => {
            const cat = q.category || 'Role-Specific';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push({ ...q, originalIndex });
        });
        return groups;
    }, [normalized]);

    return (
        <div className="space-y-5">
            {Object.entries(grouped).map(([category, items]) => {
                const style = CATEGORY_STYLES[category] || CATEGORY_STYLES['Role-Specific'];
                return (
                    <div key={category}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text} ${style.border} border`}>
                                {category}
                            </span>
                            <span className="text-[10px] text-gray-600">{items.length} question{items.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div
                                    key={item.originalIndex}
                                    className={`rounded-xl border transition-all ${expandedIndex === item.originalIndex
                                        ? `${style.bg} ${style.border}`
                                        : 'bg-gray-800/30 border-gray-700/30 hover:border-gray-600/50'
                                        }`}
                                >
                                    <button
                                        className="w-full text-left p-4 flex items-start gap-3"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedIndex(expandedIndex === item.originalIndex ? null : item.originalIndex);
                                        }}
                                    >
                                        <MessageCircleQuestion size={16} className={`mt-0.5 flex-shrink-0 ${style.text}`} />
                                        <span className="text-sm text-gray-200 leading-relaxed flex-1">{item.question}</span>
                                        <ChevronDown
                                            size={14}
                                            className={`text-gray-500 flex-shrink-0 mt-0.5 transition-transform ${expandedIndex === item.originalIndex ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {expandedIndex === item.originalIndex && item.hint && (
                                        <div className="px-4 pb-4 pl-11 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="flex items-start gap-2 bg-gray-900/40 rounded-lg p-3 border border-gray-700/20">
                                                <Lightbulb size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-gray-400 leading-relaxed">{item.hint}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Questions You Should Ask ───────────────────────────────────
export function QuestionsToAskList({ questions = [] }) {
    const normalized = useMemo(() => normalizeQuestions(questions), [questions]);

    if (normalized.length === 0) return null;

    // Group by type
    const grouped = useMemo(() => {
        const groups = {};
        normalized.forEach((q, i) => {
            const type = q.type || 'Clarify Role';
            if (!groups[type]) groups[type] = [];
            groups[type].push({ ...q, index: i });
        });
        return groups;
    }, [normalized]);

    return (
        <div className="space-y-5">
            {Object.entries(grouped).map(([type, items]) => {
                const style = TYPE_STYLES[type] || TYPE_STYLES['Clarify Role'];
                return (
                    <div key={type}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-base">{style.icon}</span>
                            <span className={`text-xs font-bold ${style.text}`}>{type}</span>
                            <span className="text-[10px] text-gray-600">({items.length})</span>
                        </div>
                        <div className="space-y-2.5">
                            {items.map((item) => (
                                <div
                                    key={item.index}
                                    className={`${style.bg} ${style.border} border rounded-xl p-4`}
                                >
                                    <p className="text-sm text-gray-200 font-medium leading-relaxed mb-1">
                                        {typeof item.question === 'string' ? item.question : item.question}
                                    </p>
                                    {item.reason && (
                                        <p className="text-xs text-gray-500 leading-relaxed mt-2 flex items-start gap-1.5">
                                            <span className="text-gray-600 flex-shrink-0">→</span>
                                            {item.reason}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Red Flags with Probe Questions ─────────────────────────────
export function RedFlagsList({ redFlags = [] }) {
    const normalized = useMemo(() => normalizeRedFlags(redFlags), [redFlags]);

    if (normalized.length === 0) return null;

    return (
        <div className="space-y-3">
            {normalized.map((item, i) => (
                <div key={i} className="bg-red-500/5 border border-red-500/15 rounded-xl overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-start gap-3">
                            <Shield size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-red-200/90 font-medium leading-relaxed">{item.flag}</p>
                                {item.evidence && (
                                    <p className="text-[11px] text-gray-500 mt-1.5 italic leading-relaxed">
                                        &quot;{item.evidence}&quot;
                                    </p>
                                )}
                            </div>
                        </div>
                        {item.whatToAsk && (
                            <div className="mt-3 ml-7 bg-gray-900/40 rounded-lg p-3 border border-gray-700/20">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Ask This</p>
                                <p className="text-xs text-gray-300 leading-relaxed">{item.whatToAsk}</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Quick Reference Card ───────────────────────────────────────
export function QuickReferenceCard({ app, talkingPoints = [], questionsToAsk = [] }) {
    const [copied, setCopied] = useState(false);

    const normalizedQuestions = useMemo(() => normalizeQuestions(questionsToAsk), [questionsToAsk]);

    const refText = useMemo(() => {
        let text = `🎯 QUICK REFERENCE — ${app.job_title} at ${app.company}\n`;
        text += `${'─'.repeat(50)}\n\n`;

        if (app.role_summary) text += `📌 ROLE: ${app.role_summary}\n\n`;

        text += `💰 ${app.salary || 'Salary not listed'} · 📍 ${app.location || 'Remote'} · 🏢 ${app.work_mode || 'N/A'}\n\n`;

        if (talkingPoints.length > 0) {
            text += `💡 TOP TALKING POINTS:\n`;
            talkingPoints.slice(0, 3).forEach((tp, i) => {
                const point = typeof tp === 'object' ? tp.point || tp.topic : tp;
                text += `  ${i + 1}. ${point}\n`;
            });
            text += '\n';
        }

        if (normalizedQuestions.length > 0) {
            text += `❓ KEY QUESTIONS TO ASK:\n`;
            normalizedQuestions.slice(0, 3).forEach((q, i) => {
                text += `  ${i + 1}. ${q.question}\n`;
            });
            text += '\n';
        }

        return text;
    }, [app, talkingPoints, normalizedQuestions]);

    const handleCopy = () => {
        navigator.clipboard.writeText(refText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-gray-800/20 rounded-2xl border border-gray-700/40 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/30">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    📋 Quick Reference Card
                </h4>
                <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 text-white text-[11px] font-medium rounded-lg transition-colors"
                >
                    {copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
            </div>
            <pre className="text-xs text-gray-300 p-5 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[300px] overflow-y-auto">
                {refText}
            </pre>
        </div>
    );
}
