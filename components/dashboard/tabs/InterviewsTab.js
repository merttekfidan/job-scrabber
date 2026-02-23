import React from 'react';
import { X } from 'lucide-react';
import { InterviewProgress } from '../VisualFrameworks';
import { StageNoteEditor } from '../shared/NoteEditors';
import { parseJson } from '../utils';

export function InterviewsTab({ app, onUpdateDetails }) {
    const stages = parseJson(app.interview_stages) || [];

    return (
        <div className="space-y-6">
            <InterviewProgress stages={stages} currentStatus={app.status} />
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Interview Rounds</h3>
                    <button
                        className="btn btn-secondary btn-sm flex items-center gap-2"
                        onClick={(e) => {
                            e.stopPropagation();
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
                        <div className="w-4 h-4 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">+</div>
                        Add Round
                    </button>
                </div>

                {stages.length === 0 ? (
                    <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                        <p className="text-gray-400 text-base">No interviews tracked yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {stages.map((stage, idx) => (
                            <div key={stage.id || idx} className="bg-gray-800/40 rounded-xl border border-gray-700/50 overflow-hidden">
                                <div className="p-3 bg-gray-800/80 border-b border-gray-700/50 flex flex-wrap gap-3 items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-blue-400 text-base">{stage.round}</span>
                                        <select
                                            className="bg-gray-900 border border-gray-700 text-gray-300 text-base rounded-lg p-1.5 outline-none"
                                            value={stage.type}
                                            onClick={e => e.stopPropagation()}
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
                                            onClick={e => e.stopPropagation()}
                                            onChange={(e) => {
                                                const newStages = [...stages];
                                                newStages[idx].date = e.target.value;
                                                onUpdateDetails(app.id, { interview_stages: newStages });
                                            }}
                                        />
                                        <button
                                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Delete round?')) {
                                                    const newStages = stages.filter((_, i) => i !== idx);
                                                    onUpdateDetails(app.id, { interview_stages: newStages });
                                                }
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                                <StageNoteEditor
                                    initialNotes={stage.notes}
                                    onSave={(newNotes) => {
                                        const newStages = [...stages];
                                        newStages[idx].notes = newNotes;
                                        onUpdateDetails(app.id, { interview_stages: newStages });
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

