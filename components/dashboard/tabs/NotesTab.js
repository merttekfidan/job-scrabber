import React from 'react';
import { GeneralNoteEditor } from '../shared/NoteEditors';
import { parseJson } from '../utils';

export function NotesTab({ app, onUpdateDetails }) {
    return (
        <div className="h-full">
            <GeneralNoteEditor
                initialNotes={(() => {
                    const prep = typeof app.interview_prep_notes === 'string'
                        ? parseJson(app.interview_prep_notes)
                        : app.interview_prep_notes || {};
                    return prep.generalNotes || '';
                })()}
                onSave={async (newNotes) => {
                    let currentPrep = {};
                    if (typeof app.interview_prep_notes === 'string') {
                        currentPrep = parseJson(app.interview_prep_notes) || {};
                    } else if (app.interview_prep_notes) {
                        currentPrep = app.interview_prep_notes;
                    }

                    const updatedPrep = {
                        keyTalkingPoints: [],
                        questionsToAsk: [],
                        potentialRedFlags: [],
                        techStackToStudy: [],
                        ...currentPrep,
                        generalNotes: newNotes
                    };
                    await onUpdateDetails(app.id, { interview_prep_notes: updatedPrep });
                }}
            />
        </div>
    );
}

