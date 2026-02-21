'use client';

import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function UpcomingInterviews({ interviews, onViewPrep }) {
    if (!interviews || interviews.length === 0) return null;

    return (
        <section className="timeline-section mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <h2 className="section-title flex items-center gap-2">
                <CalendarIcon className="text-blue-400" /> Upcoming Interviews
            </h2>
            <div className="space-y-3">
                {interviews.map((interview, idx) => (
                    <div key={idx} className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-xl flex items-center justify-between hover:bg-gray-800/60 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-lg">
                                {new Date(interview.date).getDate()}
                            </div>
                            <div>
                                <div className="font-semibold text-white">{interview.appName}</div>
                                <div className="text-sm text-gray-400">{interview.type} Round • {new Date(interview.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short' })}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => onViewPrep(interview.appId)}
                            className="btn btn-sm btn-secondary"
                        >
                            View Prep
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}
