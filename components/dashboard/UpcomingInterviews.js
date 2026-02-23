'use client';

import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

export default function UpcomingInterviews({ interviews, onViewPrep }) {
    if (!interviews || interviews.length === 0) return null;

    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-indigo-400" />
                <h3 className="label-uppercase">Upcoming Interviews</h3>
            </div>

            <div className="space-y-3">
                {interviews.map((interview, idx) => {
                    const interviewDate = new Date(interview.date);
                    const now = new Date();
                    const daysUntil = Math.ceil((interviewDate - now) / (1000 * 60 * 60 * 24));
                    const isToday = daysUntil <= 0;

                    return (
                        <div
                            key={idx}
                            className={`p-3 rounded-lg border space-y-2 transition-all cursor-pointer hover:border-indigo-500/30 ${isToday
                                    ? 'border-amber-500/40 bg-amber-500/5'
                                    : 'border-white/5 bg-gray-900/30'
                                }`}
                            onClick={() => onViewPrep(interview.appId)}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-white">{interview.appName}</span>
                                <span className="px-2 py-0.5 text-[10px] rounded-full border border-indigo-500/30 text-indigo-300">
                                    {interview.type || interview.round}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <CalendarIcon size={10} />
                                    {interviewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                {interview.time && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={10} /> {interview.time}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? 'text-amber-400' : daysUntil <= 2 ? 'text-indigo-400' : 'text-gray-600'
                                }`}>
                                {isToday ? 'Today' : `In ${daysUntil} days`}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
