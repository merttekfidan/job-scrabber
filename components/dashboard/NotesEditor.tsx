'use client';

import React from 'react';
import { PenTool } from 'lucide-react';
import type { Application } from '@/types/application';

type PrepNotes = { generalNotes?: string; [key: string]: unknown };

type NotesEditorProps = {
  app: Application;
  setApp: React.Dispatch<React.SetStateAction<Application>>;
  onUpdateDetails: (updates: Record<string, unknown>) => Promise<void>;
  isShared: boolean;
  prep: PrepNotes;
};

export const NotesEditor = ({
  app,
  setApp,
  onUpdateDetails,
  isShared,
  prep,
}: NotesEditorProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrep = { ...prep, generalNotes: e.target.value };
    setApp({
      ...app,
      interview_prep_notes: JSON.stringify(newPrep),
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const newPrep = { ...prep, generalNotes: e.target.value };
    onUpdateDetails({ interview_prep_notes: newPrep });
  };

  return (
    <div className="rounded-2xl border border-gray-700/50 bg-gray-800/20 p-6">
      <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
        <PenTool className="text-orange-400" /> General Notes
      </h3>
      {!isShared ? (
        <textarea
          className="h-32 w-full resize-none rounded-xl border border-gray-700 bg-gray-900/50 p-4 text-gray-300 transition-all focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/20"
          placeholder="Jot down your thoughts, impressions, or next steps..."
          value={prep.generalNotes || ''}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      ) : (
        <div className="min-h-[100px] whitespace-pre-wrap rounded-xl border border-gray-700 bg-gray-900/50 p-4 text-gray-300">
          {prep.generalNotes || 'No notes available.'}
        </div>
      )}
    </div>
  );
};
