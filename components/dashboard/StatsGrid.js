'use client';

import React from 'react';
import { Briefcase, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function StatsGrid({ stats }) {
    return (
        <section className="analytics-section mb-8">
            <h2 className="section-title text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Your Journey Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Apps */}
                <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-xl p-4 hover:bg-gray-800/40 hover:border-white/10 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
                            <Briefcase size={18} />
                        </div>
                        {stats?.last7Days > 0 && (
                            <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                                +{stats.last7Days}
                            </span>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stats?.total || 0}</div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Applications</div>
                </div>

                {/* Interviews */}
                <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-xl p-4 hover:bg-gray-800/40 hover:border-white/10 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                            <Clock size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        {stats?.byStatus?.find(s => s.status.includes('Interview'))?.count || 0}
                    </div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Interviews Scheduled</div>
                </div>

                {/* Offers */}
                <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-xl p-4 hover:bg-gray-800/40 hover:border-white/10 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400 group-hover:scale-110 transition-transform">
                            <CheckCircle size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        {stats?.byStatus?.find(s => s.status.includes('Offer'))?.count || 0}
                    </div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Offers Received</div>
                </div>

                {/* Rejections */}
                <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-xl p-4 hover:bg-gray-800/40 hover:border-white/10 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-400 group-hover:scale-110 transition-transform">
                            <XCircle size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        {stats?.byStatus?.find(s => s.status.includes('Rejected'))?.count || 0}
                    </div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Rejections</div>
                </div>
            </div>
        </section>
    );
}
