'use client';

import React from 'react';
import { Calendar, Plus, AlertCircle } from 'lucide-react';
import { safeParseJson, formatDate } from '@/lib/utils';
import { InterviewProgress } from '@/components/dashboard/VisualFrameworks';
import type { Application } from '@/types/application';

type InterviewStage = { id?: number; round?: string; date?: string; type?: string; notes?: string };

type InterviewTimelineProps = {
  app: Application;
  setApp: React.Dispatch<React.SetStateAction<Application>>;
  onUpdateDetails: (updates: Record<string, unknown>) => Promise<void>;
  isShared: boolean;
  isSaving: boolean;
};

export const InterviewTimeline = ({
  app,
  setApp,
  onUpdateDetails,
  isShared,
  isSaving,
}: InterviewTimelineProps) => {
  const stages = safeParseJson<InterviewStage[]>(app.interview_stages, []);

  const handleAddRound = () => {
    const newStage: InterviewStage = {
      id: Date.now(),
      round: `Round ${stages.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Screening',
      notes: '',
    };
    onUpdateDetails({ interview_stages: [...stages, newStage] });
  };

  const updateStage = (idx: number, field: keyof InterviewStage, value: string) => {
    const updated = [...stages];
    updated[idx] = { ...updated[idx], [field]: value };
    setApp({ ...app, interview_stages: JSON.stringify(updated) as unknown as Application['interview_stages'] });
  };

  const persistStages = (updated: InterviewStage[]) => {
    onUpdateDetails({ interview_stages: updated });
  };

  const removeStage = (idx: number) => {
    const updated = [...stages];
    updated.splice(idx, 1);
    onUpdateDetails({ interview_stages: updated });
  };

  return (
    <div className="rounded-2xl border border-gray-700/50 bg-gray-800/20 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xl font-bold text-white">
          <Calendar className="text-blue-400" /> Interview Timeline
        </h3>
        {!isShared && (
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-600/20 px-3 py-1.5 text-base font-medium text-blue-400 transition-colors hover:bg-blue-600/40"
            onClick={handleAddRound}
            disabled={isSaving}
          >
            <Plus size={14} /> Add Round
          </button>
        )}
      </div>

      <div className="mb-8">
        <InterviewProgress stages={stages as any} currentStatus={app.status} />
      </div>

      <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent md:before:mx-auto md:before:translate-x-0">
        {stages.length === 0 ? (
          <div className="relative z-10 rounded-xl bg-[#0f1117]/80 py-4 text-center text-gray-500">
            No interviews scheduled yet.
          </div>
        ) : (
          stages.map((stage, idx) => (
            <div
              key={idx}
              className="group relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse is-active"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-700 bg-gray-900 text-base font-bold text-slate-400 shadow-sm transition-colors z-10 md:order-1 md:-translate-x-1/2 md:group-even:translate-x-1/2">
                {idx + 1}
              </div>
              <div className="w-[calc(100%-4rem)] rounded-xl border border-gray-700/50 bg-gray-800/40 p-4 shadow-sm transition-all hover:bg-gray-800/60 md:w-[calc(50%-2.5rem)] group-odd:md:ml-auto">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    {!isShared ? (
                      <div className="flex w-full items-center gap-2">
                        <input
                          type="text"
                          className="w-1/3 border-b border-transparent bg-transparent px-1 py-0.5 text-base font-bold text-white transition-colors hover:border-gray-600 focus:border-blue-500 focus:outline-none"
                          value={stage.round || ''}
                          onChange={(e) => updateStage(idx, 'round', e.target.value)}
                          onBlur={(e) => {
                            const updated = stages.map((s, i) =>
                              i === idx ? { ...s, round: e.target.value } : s
                            );
                            persistStages(updated);
                          }}
                        />
                        <input
                          type="date"
                          className="w-1/3 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-base text-blue-400 focus:border-blue-500 focus:outline-none"
                          value={stage.date || ''}
                          onChange={(e) => updateStage(idx, 'date', e.target.value)}
                          onBlur={(e) => {
                            const updated = stages.map((s, i) =>
                              i === idx ? { ...s, date: e.target.value } : s
                            );
                            persistStages(updated);
                          }}
                        />
                        <button
                          type="button"
                          className="ml-auto p-1 text-gray-500 hover:text-red-400"
                          onClick={() => removeStage(idx)}
                          aria-label="Remove stage"
                        >
                          <AlertCircle size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-bold text-white">{stage.round}</h4>
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-base font-medium text-blue-400">
                          {formatDate(stage.date)}
                        </span>
                      </>
                    )}
                  </div>
                  {!isShared ? (
                    <textarea
                      placeholder="Interview notes, technical questions asked, impressions..."
                      className="min-h-[80px] w-full rounded-lg border border-gray-700/50 bg-black/20 p-3 text-base text-gray-300 transition-colors focus:border-blue-500 focus:outline-none"
                      value={stage.notes || ''}
                      onChange={(e) => updateStage(idx, 'notes', e.target.value)}
                      onBlur={(e) => {
                        const updated = stages.map((s, i) =>
                          i === idx ? { ...s, notes: e.target.value } : s
                        );
                        persistStages(updated);
                      }}
                    />
                  ) : (
                    stage.notes && (
                      <div className="whitespace-pre-wrap rounded-lg border border-white/5 bg-black/20 p-3 text-base text-gray-300">
                        {stage.notes}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
