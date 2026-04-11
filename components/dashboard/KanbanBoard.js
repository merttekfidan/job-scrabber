'use client';

import React, { useState, useEffect } from 'react';
import { Briefcase, BookOpen, Calendar, CheckCircle, Search, Sparkles } from 'lucide-react';
import { getStatusClass, formatDate, formatSalary } from './utils';
import { ApplicationListSkeleton } from './Skeletons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function KanbanBoard({
    applications,
    isLoading,
    onCardClick,
    onStatusChange // Need a new prop to handle updates
}) {
    // Local state for optimistic UI updates during drag
    const [localApps, setLocalApps] = useState([]);

    useEffect(() => {
        setLocalApps(applications);
    }, [applications]);

    if (isLoading && applications.length === 0) {
        return (
            <div className="flex gap-6 overflow-x-auto pb-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="min-w-[300px] w-[300px] space-y-4">
                        <div className="h-8 bg-gray-800/50 rounded-lg animate-pulse"></div>
                        <ApplicationListSkeleton count={2} />
                    </div>
                ))}
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <div className="empty-state text-center py-20 opacity-70">
                <Briefcase size={48} className="mx-auto mb-4 text-purple-400" />
                <h3 className="text-xl font-bold text-white mb-2">Your Pipeline is Empty</h3>
                <p className="text-base text-gray-400">Save some jobs from the extension to see them here.</p>
            </div>
        );
    }

    const COLUMNS = [
        { id: 'Applied', title: 'Applied', icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { id: 'Prep', title: 'Prep', icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-500/10' },
        { id: 'Interview Scheduled', title: 'Interviewing', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { id: 'Offer Received', title: 'Offer Final', icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10', isClosed: true }
    ];

    const getColumnForApp = (app) => {
        // Map any old 'Closed', 'Rejected', 'Withdrawn' to 'Applied' or filter them out.
        // For now, mapping non-standard to 'Applied' to keep them visible, 
        // OR we can just omit 'Rejected'/'Withdrawn' from this view if they're considered "done".
        // Let's keep them in Applied if they don't match our 3 main columns for simplicity of DND.
        if (['Applied', 'Prep', 'Interview Scheduled', 'Offer Received'].includes(app.status)) {
            return app.status;
        }
        return 'Applied'; // fallback
    };

    const groupedApps = COLUMNS.reduce((acc, col) => {
        acc[col.id] = localApps.filter(app => getColumnForApp(app) === col.id);
        return acc;
    }, {});


    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;

        // Dropped outside a valid droppable area
        if (!destination) return;

        // Dropped in the same place
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceColumn = source.droppableId;
        const targetColumn = destination.droppableId;

        // Optimistic Update
        const updatedApps = localApps.map(app => {
            if (app.id.toString() === draggableId) {
                return { ...app, status: targetColumn };
            }
            return app;
        });

        setLocalApps(updatedApps);

        // Notify parent to save to DB
        if (sourceColumn !== targetColumn && onStatusChange) {
            onStatusChange(parseInt(draggableId), targetColumn);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex items-start gap-5 overflow-x-auto pb-6 snap-x" style={{ minHeight: 'calc(100vh - 180px)' }}>
                {COLUMNS.map(col => {
                    const apps = groupedApps[col.id] || [];

                    return (
                        <div key={col.id} className="min-w-[320px] w-[320px] shrink-0 snap-start flex flex-col h-full">
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-3 px-1">
                                <div className="flex items-center gap-2 text-base font-bold text-gray-300">
                                    <span className={`p-1.5 rounded-lg \${col.bg} \${col.color}`}>
                                        <col.icon size={16} strokeWidth={2.5} />
                                    </span>
                                    {col.title}
                                </div>
                                <span className="text-base font-mono bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                                    {apps.length}
                                </span>
                            </div>

                            {/* Drop Zone / Cards Container */}
                            <Droppable droppableId={col.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`flex-1 bg-gray-900/40 rounded-xl border border-white/5 p-3 space-y-3 overflow-y-auto min-h-[150px] transition-colors \${snapshot.isDraggingOver ? 'bg-gray-800/50 border-purple-500/30' : ''}`}
                                    >
                                        {apps.map((app, index) => (
                                            <Draggable key={app.id.toString()} draggableId={app.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => onCardClick(app.id)}
                                                        className={`bg-gray-800/60 hover:bg-gray-700/80 rounded-xl border border-gray-700/50 hover:border-gray-500/50 transition-all cursor-pointer p-4 group \${snapshot.isDragging ? 'shadow-lg shadow-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/50 z-50' : ''}`}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                        }}
                                                    >
                                                        <h4 className="text-base font-bold text-white mb-1 leading-snug group-hover:text-purple-300 transition-colors">
                                                            {app.job_title}
                                                        </h4>
                                                        <div className="text-base text-gray-400 mb-3">{app.company}</div>

                                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-700/30">
                                                            <div className="text-[10px] text-gray-500 font-mono">
                                                                {formatDate(app.application_date)}
                                                            </div>
                                                            {app.salary && (
                                                                <div className="text-[10px] text-emerald-400/80 font-medium">
                                                                    {formatSalary(app.salary)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        {apps.length === 0 && !snapshot.isDraggingOver && (
                                            <div className="h-full flex items-center justify-center p-6 text-center">
                                                <div className="text-base text-gray-600 border border-dashed border-gray-700 rounded-lg p-6 w-full">
                                                    Drop here
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
