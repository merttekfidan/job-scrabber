'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Save, Check } from 'lucide-react';

export default function NotesPanel({ app, onUpdateDetails }) {
    const [notes, setNotes] = useState('');
    const [saved, setSaved] = useState(false);
    const textareaRef = useRef(null);
    const saveTimeout = useRef(null);

    // Load notes from app data
    useEffect(() => {
        const prep = typeof app.interview_prep_notes === 'string'
            ? safeJsonParse(app.interview_prep_notes)
            : app.interview_prep_notes || {};
        setNotes(prep.generalNotes || '');
    }, [app.id, app.interview_prep_notes]);

    function safeJsonParse(str) {
        try { return typeof str === 'string' ? JSON.parse(str) : str || {}; }
        catch { return {}; }
    }

    const saveNotes = useCallback(async (value) => {
        let currentPrep = {};
        if (typeof app.interview_prep_notes === 'string') {
            currentPrep = safeJsonParse(app.interview_prep_notes) || {};
        } else if (app.interview_prep_notes) {
            currentPrep = app.interview_prep_notes;
        }

        const updatedPrep = {
            keyTalkingPoints: [],
            questionsToAsk: [],
            potentialRedFlags: [],
            techStackToStudy: [],
            ...currentPrep,
            generalNotes: value
        };

        await onUpdateDetails(app.id, { interview_prep_notes: updatedPrep });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }, [app.id, app.interview_prep_notes, onUpdateDetails]);

    // Auto-save on blur
    const handleBlur = () => {
        saveNotes(notes);
    };

    // Auto-save after 2s of no typing
    const handleChange = (e) => {
        const value = e.target.value;
        setNotes(value);
        setSaved(false);

        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            saveNotes(value);
        }, 2000);
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    }, []);

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-amber-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</span>
                </div>
                {saved && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 animate-in fade-in">
                        <Check size={10} /> Saved
                    </span>
                )}
            </div>
            <textarea
                ref={textareaRef}
                value={notes}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Type your notes here... &#10;&#10;• Key observations&#10;• Follow-up tasks&#10;• Recruiter contacts&#10;&#10;Auto-saves as you type."
                className="flex-1 w-full min-h-[300px] bg-gray-900/50 border border-white/5 rounded-xl p-4 text-sm text-gray-300 leading-relaxed resize-none outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/10 transition-all placeholder:text-gray-700"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
            />
            <div className="mt-2 text-[10px] text-gray-700 text-right">
                {notes.length > 0 ? `${notes.length} chars` : 'Empty'}
            </div>
        </div>
    );
}
