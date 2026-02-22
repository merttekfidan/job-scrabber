'use client';

import React from 'react';
import { Briefcase, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function StatsGrid({ stats }) {
    return (
        <section className="analytics-section mb-6">
            <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-black/20">
                {/* Total Apps */}
                <div className="flex flex-1 items-center gap-4 border-r border-white/10 pr-4 min-w-[120px]">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white leading-none flex items-center gap-2">
                            {stats?.total || 0}
                            {stats?.last7Days > 0 && (
                                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                                    +{stats.last7Days}
                                </span>
                            )}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1.5">Total Apps</div>
                    </div>
                </div>

                {/* Interviews */}
                <div className="flex flex-1 items-center gap-4 border-r border-white/10 pr-4 min-w-[120px]">
                    <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400">
                        <Clock size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white leading-none">
                            {stats?.byStatus?.find(s => s.status.includes('Interview'))?.count || 0}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1.5">Interviews</div>
                    </div>
                </div>

                {/* Offers */}
                <div className="flex flex-1 items-center gap-4 border-r border-white/10 pr-4 min-w-[120px]">
                    <div className="p-2.5 bg-green-500/10 rounded-xl text-green-400">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white leading-none">
                            {stats?.byStatus?.find(s => s.status.includes('Offer'))?.count || 0}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1.5">Offers</div>
                    </div>
                </div>

                {/* Rejections */}
                <div className="flex flex-1 items-center gap-4 min-w-[120px]">
                    <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400">
                        <XCircle size={20} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white leading-none">
                            {stats?.byStatus?.find(s => s.status.includes('Rejected'))?.count || 0}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1.5">Rejections</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
