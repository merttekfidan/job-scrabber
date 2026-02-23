import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export function StageNoteEditor({ initialNotes, onSave }) {
    const [notes, setNotes] = useState(initialNotes || '');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNotes(initialNotes || '');
        setIsDirty(false);
    }, [initialNotes]);

    return (
        <div className="p-3 flex flex-col gap-2">
            <textarea
                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-base text-gray-300 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-24"
                placeholder="Interview notes..."
                value={notes}
                onClick={e => e.stopPropagation()}
                onChange={(e) => { setNotes(e.target.value); setIsDirty(true); }}
            />
            {isDirty && (
                <div className="flex justify-end gap-2">
                    <span className="text-base text-amber-400 self-center">Unsaved changes</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSave(notes); setIsDirty(false); }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-base font-medium rounded hover:bg-blue-500 transition-colors flex items-center gap-1"
                    >
                        <CheckCircle size={12} /> Save
                    </button>
                </div>
            )}
        </div>
    );
}

export function GeneralNoteEditor({ initialNotes, onSave }) {
    const [notes, setNotes] = useState(initialNotes || '');
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saved', 'error'

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNotes(initialNotes || '');
        setIsDirty(false);
        setSaveStatus('idle');
    }, [initialNotes]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await onSave(notes);
            if (res === undefined || res?.success || res?.message === 'Updated successfully' || res === true) {
                setIsDirty(false);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 2000);
            }
        } catch (error) {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="flex justify-between items-center bg-gray-800/30 p-3 rounded-t-lg border border-gray-700/50 border-b-0">
                <span className="text-base font-medium text-gray-400">My General Notes</span>
                {saveStatus === 'error' ? (
                    <span className="text-base text-red-400 flex items-center gap-1">
                        <AlertCircle size={12} /> Failed to save
                    </span>
                ) : isDirty ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSave(); }}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Save Notes
                    </button>
                ) : (
                    <span className="text-base text-green-500 flex items-center gap-1">
                        <CheckCircle size={12} /> Saved
                    </span>
                )}
            </div>
            <textarea
                className="w-full flex-1 bg-gray-900/30 border border-gray-700/50 rounded-b-lg p-6 text-base text-gray-200 focus:ring-1 focus:ring-blue-500/50 outline-none resize-none min-h-[400px] leading-relaxed"
                placeholder="Write your thoughts, to-do lists, or draft emails here..."
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setIsDirty(true); }}
            />
        </div>
    );
}

