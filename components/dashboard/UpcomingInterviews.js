'use client';

import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function UpcomingInterviews({ interviews, onViewPrep }) {
    if (!interviews || interviews.length === 0) return null;

    return (
        <section className="timeline-section animate-in fade-in slide-in-from-right-4 duration-500 delay-100 bg-gray-900/30 border border-white/5 rounded-2xl p-5 w-full">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <CalendarIcon size={16} className="text-blue-400" /> Upcoming
            </h2>
            <div className="space-y-3">
                {interviews.map((interview, idx) => (
                    <div key={idx} className="bg-gray-800/50 border border-gray-700/50 p-3 rounded-xl hover:bg-gray-800/80 transition-colors group cursor-pointer" onClick={() => onViewPrep(interview.appId)}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex flex-col items-center justify-center text-blue-400 shrink-0">
                                <span className="text-[10px] font-bold uppercase leading-none">{new Date(interview.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                <span className="text-lg font-bold leading-tight">{new Date(interview.date).getDate()}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-bold text-white text-sm truncate">{interview.appName}</div>
                                <div className="text-xs text-gray-400 truncate mt-0.5">{interview.type} Round</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
